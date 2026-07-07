// Debe ser la misma URL usada en app.js
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNmAue-q-jIrDwNT71-YiTFqDtJDD2qiAau8y-QJEvaOL9F7gpVLbs6DWGCWOOeZKo/exec';

let adminPassword = ''; 

document.getElementById('btnLogin').addEventListener('click', async () => {
    const pwd = document.getElementById('adminPassword').value;
    const loginError = document.getElementById('loginError');
    const btnLogin = document.getElementById('btnLogin');

    loginError.style.display = 'none';
    btnLogin.disabled = true;
    btnLogin.innerText = 'Verificando...';

    try {
        const resp = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'adminGetConfig', password: pwd })
        });
        const data = await resp.json();

        if (data.status === 'success') {
            adminPassword = pwd;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('panelSection').style.display = 'block';
            renderTabla(data.rangos);
        } else {
            loginError.textContent = data.message || 'Clave incorrecta.';
            loginError.style.display = 'block';
        }
    } catch (err) {
        loginError.textContent = 'Error de conexión. Intente nuevamente.';
        loginError.style.display = 'block';
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerText = 'Ingresar';
    }
});

function renderTabla(rangos) {
    const tbody = document.getElementById('tablaCuposBody');
    tbody.innerHTML = '';
    rangos.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.rango} años</td>
            <td>${r.categoria}</td>
            <td>${r.inscritos}</td>
            <td><input type="number" min="0" class="input-limite" data-rango="${r.rango}" value="${r.limite}"></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('btnGuardar').addEventListener('click', async () => {
    const guardarMsg = document.getElementById('guardarMsg');
    const btnGuardar = document.getElementById('btnGuardar');

    const nuevosLimites = Array.from(document.querySelectorAll('.input-limite')).map(input => ({
        rango: input.dataset.rango,
        limite: parseInt(input.value, 10)
    }));

    btnGuardar.disabled = true;
    btnGuardar.innerText = 'Guardando...';
    guardarMsg.style.display = 'none';

    try {
        const resp = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'adminUpdateConfig', password: adminPassword, limites: nuevosLimites })
        });
        const data = await resp.json();

        guardarMsg.style.display = 'block';
        if (data.status === 'success') {
            guardarMsg.style.color = '#0a7a0a';
            guardarMsg.textContent = 'Cambios guardados correctamente.';
            renderTabla(data.rangos);
        } else {
            guardarMsg.style.color = '#ff0000';
            guardarMsg.textContent = 'Error: ' + data.message;
        }
    } catch (err) {
        guardarMsg.style.display = 'block';
        guardarMsg.style.color = '#ff0000';
        guardarMsg.textContent = 'Error de conexión. Intente nuevamente.';
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = 'Guardar Cambios';
    }
});
