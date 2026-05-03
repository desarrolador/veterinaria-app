document.getElementById('registro-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const aceptarEmail = document.getElementById('aceptar-email').checked;
    
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    if (!aceptarEmail) {
        alert('Debes aceptar recibir información por email');
        return;
    }
    
    // Aquí puedes enviar los datos al servidor
    // Por ejemplo, usando fetch() para POST a una API
    
    alert('Usuario registrado: ' + nombre + ', ' + email);
    // Resetear el formulario
    this.reset();
});