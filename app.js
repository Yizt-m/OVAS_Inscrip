// Pega aquí la URL que te dio Google Apps Script en el paso anterior
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNmAue-q-jIrDwNT71-YiTFqDtJDD2qiAau8y-QJEvaOL9F7gpVLbs6DWGCWOOeZKo/exec';

// Debe coincidir con RANGOS_EDAD en code.js
const RANGOS_EDAD = [
    { key: '0-5',   min: 0,  max: 5,        categoria: 'Infantil' },
    { key: '6-7',   min: 6,  max: 7,        categoria: 'Infantil' },
    { key: '8-9',   min: 8,  max: 9,        categoria: 'Infantil' },
    { key: '10-11', min: 10, max: 11,       categoria: 'Infantil' },
    { key: '12-13', min: 12, max: 13,       categoria: 'Juvenil' },
    { key: '14-15', min: 14, max: 15,       categoria: 'Juvenil' },
    { key: '16-17', min: 16, max: 17,       categoria: 'Juvenil' },
    { key: '18+',   min: 18, max: Infinity, categoria: 'Juvenil' }
];

const MAX_PARTICIPANTES = 15; // límite técnico de seguridad, no una regla de negocio
const MAX_FOTO_BYTES = 5 * 1024 * 1024; // 5MB

let cuposPorRango = {}; // rango -> {rango, categoria, limite, inscritos, disponibles}
let contadorNinos = 0;

/* ================== Utilidades de edad / cupos ================== */

function calcularEdad(fechaStr) {
    if (!fechaStr) return null;
    const nacimiento = new Date(fechaStr + 'T00:00:00');
    if (isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad >= 0 ? edad : null;
}

function obtenerRango(edad) {
    return RANGOS_EDAD.find(r => edad >= r.min && edad <= r.max) || null;
}

async function cargarCupos() {
    try {
        const resp = await fetch(`${SCRIPT_URL}?action=getPublicConfig`);
        const data = await resp.json();
        if (data.status === 'success') {
            cuposPorRango = {};
            data.rangos.forEach(r => { cuposPorRango[r.rango] = r; });
        }
    } catch (err) {
        console.error('No se pudo cargar la configuración de cupos:', err);
    }
}

/* ================== Tarjetas de participantes ================== */

function crearTarjetaParticipante() {
    contadorNinos++;
    const div = document.createElement('div');
    div.className = 'participante-card';

    div.innerHTML = `
        <h3>Niño/a #${contadorNinos}</h3>
        <div class="form-group">
            <label>Nombre *</label>
            <input type="text" class="p-nombre" required>
        </div>
        <div class="form-group">
            <label>Apellido *</label>
            <input type="text" class="p-apellido" required>
        </div>
        <div class="form-group">
            <label>Documento de Identidad o Partida de Nacimiento *</label>
            <input type="text" class="p-documento" required>
        </div>
        <div class="form-group">
            <label>Fecha de Nacimiento *</label>
            <input type="date" class="p-fecha" max="${new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
            <label>Edad</label>
            <input type="text" class="p-edad" readonly>
        </div>
        <div class="form-group">
            <label>Talla de Franela *</label>
            <input type="text" class="p-talla" placeholder="Ej: 8, 10, M, L" required>
        </div>
        <p class="cupos-agotados" style="display:none;"></p>
        <button type="button" class="btn-secondary btn-quitar">Quitar este niño</button>
    `;

    div.querySelector('.p-fecha').addEventListener('change', () => actualizarEdad(div));
    div.querySelector('.btn-quitar').addEventListener('click', () => {
        div.remove();
        validarCuposGlobal();
    });

    return div;
}

function actualizarEdad(card) {
    const fecha = card.querySelector('.p-fecha').value;
    const edad = calcularEdad(fecha);
    const edadInput = card.querySelector('.p-edad');

    if (edad === null) {
        edadInput.value = '';
        delete card.dataset.edad;
        card.querySelector('.cupos-agotados').style.display = 'none';
        return;
    }

    edadInput.value = edad + ' años';
    card.dataset.edad = edad;
    validarCuposGlobal();
}

// Revisa, para cada tarjeta actual, si el rango de edad correspondiente ya no
// tiene cupo disponible (considerando también a los otros niños del mismo
// formulario). El backend vuelve a validar esto de forma definitiva al enviar.
function validarCuposGlobal() {
    const usados = {};
    let hayBloqueo = false;

    document.querySelectorAll('.participante-card').forEach(card => {
        const msg = card.querySelector('.cupos-agotados');
        const edad = card.dataset.edad !== undefined ? parseInt(card.dataset.edad, 10) : NaN;

        if (isNaN(edad)) {
            msg.style.display = 'none';
            return;
        }

        const rango = obtenerRango(edad);
        const info = rango ? cuposPorRango[rango.key] : null;

        if (!rango || !info) {
            msg.style.display = 'none';
            return;
        }

        usados[rango.key] = (usados[rango.key] || 0) + 1;

        if (usados[rango.key] > info.disponibles) {
            msg.textContent = `Cupos agotados para el rango ${rango.key} años (${rango.categoria}). Contacte al colegio.`;
            msg.style.display = 'block';
            hayBloqueo = true;
        } else {
            msg.style.display = 'none';
        }
    });

    document.querySelector('.btn-primary').disabled = hayBloqueo;
}

document.getElementById('btnAgregarNino').addEventListener('click', () => {
    const cardsActuales = document.querySelectorAll('.participante-card').length;
    if (cardsActuales >= MAX_PARTICIPANTES) {
        alert(`Solo se permite agregar hasta ${MAX_PARTICIPANTES} niños por formulario.`);
        return;
    }
    document.getElementById('participantes-container').appendChild(crearTarjetaParticipante());
});

window.addEventListener('DOMContentLoaded', async () => {
    await cargarCupos();
    document.getElementById('participantes-container').appendChild(crearTarjetaParticipante());
});

/* ================== Envío del formulario ================== */

document.getElementById('ovasForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    try {
        const cards = document.querySelectorAll('.participante-card');
        if (cards.length === 0) {
            throw new Error('Debe agregar al menos un niño para continuar.');
        }

        const fotoInput = document.getElementById('repFotoCedula').files[0];
        if (!fotoInput) {
            throw new Error('Debe adjuntar la foto de la cédula del representante.');
        }
        if (fotoInput.size > MAX_FOTO_BYTES) {
            throw new Error('La foto de la cédula supera los 5MB. Use una imagen más liviana.');
        }

        submitBtn.innerText = 'Procesando inscripción...';
        submitBtn.disabled = true;

        // 1. Convertir archivo de imagen a Base64
        const fotoBase64 = await toBase64(fotoInput);

        // 2. Recolectar datos del Representante
        const representante = {
            nombre: document.getElementById('repNombre').value.trim(),
            cedula: document.getElementById('repCedula').value.trim(),
            telefono: document.getElementById('repTelefono').value.trim(),
            formaliza: document.getElementById('repFormaliza').value.trim(),
            fotoBase64: fotoBase64
        };

        // 3. Recolectar datos de los Participantes (la edad la calcula y valida el backend
        // a partir de la fecha de nacimiento, para que no se pueda enviar una edad manipulada)
        const participantes = [];
        cards.forEach(card => {
            participantes.push({
                nombre: card.querySelector('.p-nombre').value.trim(),
                apellido: card.querySelector('.p-apellido').value.trim(),
                documento: card.querySelector('.p-documento').value.trim(),
                fechaNacimiento: card.querySelector('.p-fecha').value,
                talla: card.querySelector('.p-talla').value.trim()
            });
        });

        // 4. Armar el Payload Final
        const payload = {
            action: 'submit',
            representante: representante,
            participantes: participantes
        };

        // 5. Enviar a Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
            // No agregamos headers estrictos de CORS porque Google Apps Script lo maneja mejor en solicitudes simples a veces.
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert('¡Pre-inscripción realizada con éxito!');
            window.location.reload();
        } else {
            alert('Hubo un error: ' + result.message);
        }

    } catch (error) {
        console.error('Error en el envío: ', error);
        alert(error.message || 'Error de conexión. Intente nuevamente.');
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// Función auxiliar para convertir archivo a Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});
