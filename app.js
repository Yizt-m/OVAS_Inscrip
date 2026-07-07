// Pega aquí la URL que te dio Google Apps Script en el paso anterior
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNmAue-q-jIrDwNT71-YiTFqDtJDD2qiAau8y-QJEvaOL9F7gpVLbs6DWGCWOOeZKo/exec';

document.getElementById('ovasForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Cambiar estado del botón para evitar múltiples envíos
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Procesando inscripción...";
    submitBtn.disabled = true;

    try {
        // 1. Convertir archivo de imagen a Base64
        const fotoInput = document.getElementById('repFotoCedula').files[0];
        const fotoBase64 = await toBase64(fotoInput);

        // 2. Recolectar datos del Representante
        const representante = {
            nombre: document.getElementById('repNombre').value,
            cedula: document.getElementById('repCedula').value,
            telefono: document.getElementById('repTelefono').value,
            formaliza: document.getElementById('repFormaliza').value,
            fotoBase64: fotoBase64
        };

        // 3. Recolectar datos de los Participantes dinámicamente
        const participantes = [];
        const cards = document.querySelectorAll('.participante-card');
        
        cards.forEach(card => {
            participantes.push({
                nombre: card.querySelector('.p-nombre').value,
                apellido: card.querySelector('.p-apellido').value,
                documento: card.querySelector('.p-documento').value,
                fechaNacimiento: card.querySelector('.p-fecha').value,
                edad: card.querySelector('.p-edad').value,
                talla: card.querySelector('.p-talla').value
            });
        });

        // 4. Armar el Payload Final
        const payload = {
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

        if(result.status === 'success') {
            alert('¡Pre-inscripción realizada con éxito!');
            document.getElementById('ovasForm').reset();
            // Recargar para limpiar participantes extra
            window.location.reload(); 
        } else {
            alert('Hubo un error: ' + result.message);
        }

    } catch (error) {
        console.error("Error en el envío: ", error);
        alert('Error de conexión. Intente nuevamente.');
    } finally {
        // Restaurar botón
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
