 // servicios.js - Lógica limpia para Más Servicios

console.log("🚀 Módulo de servicios cargado y listo");

window.solicitarServicio = function(nombreServicio) {
    console.log("Evento click detectado para:", nombreServicio);

    // 1. Pedir nombre
    const nombre = window.prompt(`¿A nombre de quién registramos la solicitud para ${nombreServicio}?`);
    if (!nombre) return; 

    // 2. Pedir email
    const email = window.prompt("¿A qué correo enviamos la confirmación?");
    if (!email) {
        alert("Se requiere un email para procesar la solicitud.");
        return;
    }

    // 3. Calcular fecha (2 días después)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 2);
    const fechaTexto = fecha.toLocaleString('es-AR', { 
        dateStyle: 'long', 
        timeStyle: 'short' 
    });

    // 4. Mostrar éxito
    alert(`✅ ¡Perfecto ${nombre}!\nHemos registrado tu pedido de ${nombreServicio}.\nTurno sugerido: ${fechaTexto}\nEnviamos los detalles a: ${email}`);
    
    console.log("Datos capturados:", {
        cliente: nombre,
        correo: email,
        servicio: nombreServicio,
        fecha: fechaTexto
    });
};