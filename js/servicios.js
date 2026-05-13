// servicios.js - Lógica sin errores y con Ticket de éxito

window.solicitarServicio = function(nombreServicio) {
    // Calculamos fecha (Hoy + 2 días)
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 2);
    const opciones = { day: 'numeric', month: 'long' };
    const fechaTexto = hoy.toLocaleDateString('es-AR', opciones);

    // Confirmación inicial
    if (window.confirm(`¿Deseas reservar ${nombreServicio} para el ${fechaTexto}?`)) {
        
        // Ponemos el nombre del servicio en el input "asunto"
        const inputAsunto = document.getElementById('asunto');
        if (inputAsunto) {
            inputAsunto.value = nombreServicio;
        }

        // Bajamos suavemente al formulario
        document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
    }
};

// Escuchamos cuando se envía el formulario
document.getElementById('form-servicios')?.addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que la página se refresque sola

    const nombreUser = document.getElementById('nombre').value;
    const servicioElegido = document.getElementById('asunto').value;

    // Ocultamos el formulario y mostramos el ticket de éxito
    document.getElementById('contenedor-formulario').classList.add('hidden');
    const ticket = document.getElementById('ticket-exito');
    const detalle = document.getElementById('detalle-reserva');

    ticket.classList.remove('hidden');
    detalle.innerHTML = `Perfecto <strong>${nombreUser}</strong>, hemos registrado tu pedido de <strong>${servicioElegido}</strong>.<br>Nos vemos pronto.`;
});