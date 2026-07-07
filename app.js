// Configuración Principal
const CONFIG = {
    maxNinosPorFamilia: 4, // Puedes ajustar este número
    // Simulador de cupos. En producción, esto se debería consultar a Google Apps Script al cargar la página.
    cuposPorEdad: {
        "6 - 7 años": 5,
        "8 - 9 años": 0,  // Agotado como ejemplo
        "10 - 11 años": 12,
        "12 - 13 años": 15,
        "14 - 15 años": 2,
        "16 - 17 años": 0, // Agotado como ejemplo
        "18 años en adelante": 10
    }
};

let contadorNinos = 0;

document.addEventListener('DOMContentLoaded', () => {
    agregarParticipante(); // Agrega el primer niño por defecto

    document.getElementById('btnAgregarNino').addEventListener('click', () => {
        if (contadorNinos < CONFIG.maxNinosPorFamilia) {
            agregarParticipante();
        }
        
        if (contadorNinos >= CONFIG.maxNinosPorFamilia) {
            document.getElementById('btnAgregarNino').style.display = 'none';
            document.getElementById('msgLimiteFamiliar').style.display = 'block';
        }
    });
});

function agregarParticipante() {
    contadorNinos++;
    const container = document.getElementById('participantes-container');
    
    // Generar las opciones del select evaluando la disponibilidad
    let opcionesEdad = `<option value="">Seleccione una edad</option>`;
    for (const [edad, cupos] of Object.entries(CONFIG.cuposPorEdad)) {
        if (cupos > 0) {
            opcionesEdad += `<option value="${edad}">${edad}</option>`;
        } else {
            // Se muestra inhabilitado
            opcionesEdad += `<option value="${edad}" disabled>${edad} (CUPOS AGOTADOS)</option>`;
        }
    }

    const html = `
        <div class="participante-card" id="nino-${contadorNinos}">
            <h4>Participante #${contadorNinos}</h4>
            <div class="form-group">
                <label>Nombres</label>
                <input type="text" class="p-nombre" required>
            </div>
            <div class="form-group">
                <label>Apellidos</label>
                <input type="text" class="p-apellido" required>
            </div>
            <div class="form-group">
                <label>Cédula o Partida de Nacimiento</label>
                <input type="text" class="p-documento" placeholder="En caso de poseer">
            </div>
            <div class="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" class="p-fecha" required>
            </div>
            <div class="form-group">
                <label>Edad</label>
                <select class="p-edad" onchange="verificarCupo(this)" required>
                    ${opcionesEdad}
                </select>
                <div class="alerta-cupo" style="display:none;"></div>
            </div>
            <div class="form-group">
                <label>Talla de Franela</label>
                <select class="p-talla" required>
                    <option value="">Indique una talla</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                </select>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// Función que reacciona si el usuario intenta hacer algo con una edad agotada
// (Aunque en el select ya están 'disabled', esto sirve como doble chequeo visual)
function verificarCupo(selectElement) {
    const alertaDiv = selectElement.nextElementSibling;
    const edadSeleccionada = selectElement.value;
    
    if (CONFIG.cuposPorEdad[edadSeleccionada] === 0) {
        alertaDiv.textContent = `Se ha agotado el cupo para niños de ${edadSeleccionada}. Si desea más información, comuníquese al 0412 - 322 28 03.`;
        alertaDiv.className = 'cupos-agotados';
        alertaDiv.style.display = 'block';
        selectElement.value = ""; // Resetea el select
    } else {
        alertaDiv.style.display = 'none';
    }
}

// Intercepción del envío para compilar los datos en un JSON estructurado
document.getElementById('ovasForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Aquí empaquetas los datos del representante y un array de participantes
    // para enviarlos a tu Google Apps Script a través de un fetch(URL, { method: 'POST' ... })
    alert("Formulario procesado. Listo para ser enviado a Google Sheets ('OVAS 2026 - Data Inscritos').");
});
