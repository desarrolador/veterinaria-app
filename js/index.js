function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarContraseña(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

document.getElementById('registro-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const aceptarEmail = document.getElementById('aceptar-email').checked;
    const errorDiv = document.getElementById('error-messages');
    
    errorDiv.innerHTML = '';
    
    // Validaciones
    if (!nombre || !email || !password) {
        errorDiv.innerHTML = 'Todos los campos son obligatorios';
        console.log('Error: campos vacíos');
        return;
    }

    if (nombre.length < 3) {
        errorDiv.innerHTML = 'El nombre debe tener al menos 3 caracteres';
        console.log('Error: nombre muy corto');
        return;
    }

    if (!validarEmail(email)) {
        errorDiv.innerHTML = 'Email inválido';
        console.log('Error: email inválido');
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.innerHTML = 'Las contraseñas no coinciden';
        console.log('Error: contraseñas no coinciden');
        return;
    }

    if (!validarContraseña(password)) {
        errorDiv.innerHTML = 'Contraseña débil: mínimo 8 caracteres, mayúscula, minúscula y número';
        console.log('Error: contraseña débil');
        return;
    }

    const boton = document.querySelector('button[type="submit"]');
    boton.disabled = true;

    const datos = {
        nombre: nombre,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        aceptarEmail: aceptarEmail
    };

    console.log('Enviando datos al servidor:', datos);

    try {
        const response = await fetch('http://localhost:3001/api/usuarios/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (response.ok) {
            localStorage.setItem('usuarioRegistrado', JSON.stringify({
                nombre: nombre,
                email: email
            }));
            console.log('Registro exitoso:', data.mensaje);
            alert(data.mensaje || 'Usuario registrado exitosamente');
            this.reset();
            boton.disabled = false;
        } else {
            console.log('Error del servidor:', data.error);
            errorDiv.innerHTML = data.error || 'Error al registrar usuario';
            boton.disabled = false;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        errorDiv.innerHTML = 'Error de conexión con el servidor. Asegúrate de que el servidor está ejecutándose en http://localhost:3001';
        boton.disabled = false;
    }
});
