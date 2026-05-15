
//configuracion

const API_URL = 'http://localhost:3001/api';
let tokenUsuario = localStorage.getItem('token') || null;
let usuarioActual = JSON.parse(localStorage.getItem('usuario')) || null;

// ==================== EVENTOS DE REGISTRO ====================

document.addEventListener('DOMContentLoaded', () => {
    const formularioRegistro = document.getElementById('registro-form');
    
    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', manejarRegistro);
    }

    // Cargar datos si el usuario ya está logueado
    if (tokenUsuario) {
        mostrarMenuUsuario();
    }
});

// Manejar registro de usuario
async function manejarRegistro(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const aceptarEmail = document.getElementById('aceptar-email').checked;

    // Validación en cliente
    if (!nombre || !email || !password || !confirmPassword) {
        mostrarAlerta('Por favor completa todos los campos', 'error');
        return;
    }

    if (password !== confirmPassword) {
        mostrarAlerta('Las contraseñas no coinciden', 'error');
        return;
    }

    if (password.length < 6) {
        mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (!validarEmail(email)) {
        mostrarAlerta('Por favor ingresa un email válido', 'error');
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/usuarios/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                email,
                password,
                confirmPassword,
                aceptarEmail
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error en el registro', 'error');
            return;
        }

        // Guardar token y datos de usuario
        tokenUsuario = datos.token;
        usuarioActual = datos.usuario;
        localStorage.setItem('token', tokenUsuario);
        localStorage.setItem('usuario', JSON.stringify(usuarioActual));

        mostrarAlerta('¡Registro exitoso!', 'exito');
        document.getElementById('registro-form').reset();
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'turnos.html';
        }, 2000);

    } catch (error) {
        console.error('Error en registro:', error);
        mostrarAlerta('Error de conexión con el servidor', 'error');
    }
}

// ==================== FUNCIONES DE TURNOS ====================

async function reservarTurno(fecha, hora, tipo, mascota, descripcion) {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/turnos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenUsuario}`
            },
            body: JSON.stringify({
                fecha,
                hora,
                tipo,
                mascota,
                descripcion
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al reservar turno', 'error');
            return false;
        }

        mostrarAlerta(datos.mensaje, 'exito');
        cargarTurnos(); // Actualizar lista
        return true;

    } catch (error) {
        console.error('Error en reservarTurno:', error);
        mostrarAlerta('Error de conexión', 'error');
        return false;
    }
}

async function cargarTurnos() {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/turnos`, {
            headers: {
                'Authorization': `Bearer ${tokenUsuario}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al obtener turnos');
        }

        const turnos = await respuesta.json();
        mostrarTurnos(turnos);

    } catch (error) {
        console.error('Error en cargarTurnos:', error);
        mostrarAlerta('Error al cargar turnos', 'error');
    }
}

function mostrarTurnos(turnos) {
    const contenedor = document.getElementById('lista-turnos');
    
    if (!contenedor) return;

    if (turnos.length === 0) {
        contenedor.innerHTML = '<p>No hay turnos reservados</p>';
        return;
    }

    contenedor.innerHTML = turnos.map(turno => `
        <div class="turno-card">
            <h3>Turno - ${turno.tipo}</h3>
            <p><strong>Fecha:</strong> ${turno.fecha}</p>
            <p><strong>Hora:</strong> ${turno.hora}</p>
            <p><strong>Mascota:</strong> ${turno.mascota || 'No especificada'}</p>
            <p><strong>Estado:</strong> <span class="estado-${turno.estado}">${turno.estado}</span></p>
            <p><strong>Descripción:</strong> ${turno.descripcion || '-'}</p>
            <button onclick="eliminarTurno(${turno.id})">Cancelar Turno</button>
        </div>
    `).join('');
}

async function eliminarTurno(turnoId) {
    if (!confirm('¿Estás seguro de que quieres cancelar este turno?')) return;

    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/turnos/${turnoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenUsuario}`,
               
            }
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al eliminar turno', 'error');
            return;
        }

        mostrarAlerta(datos.mensaje, 'exito');
        cargarTurnos();

    } catch (error) {
        console.error('Error en eliminarTurno:', error);
        mostrarAlerta('Error de conexión', 'error');
    }
}

// ==================== FUNCIONES DE CONSULTAS ====================

async function enviarConsulta(asunto, mensaje) {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/consultas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenUsuario}`
            },
            body: JSON.stringify({
                asunto,
                mensaje
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al enviar consulta', 'error');
            return false;
        }

        mostrarAlerta(datos.mensaje, 'exito');
        return true;

    } catch (error) {
        console.error('Error en enviarConsulta:', error);
        mostrarAlerta('Error de conexión', 'error');
        return false;
    }
}

async function cargarConsultas() {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/consultas`, {
            headers: {
                'Authorization': `Bearer ${tokenUsuario}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al obtener consultas');
        }

        const consultas = await respuesta.json();
        mostrarConsultas(consultas);

    } catch (error) {
        console.error('Error en cargarConsultas:', error);
    }
}

function mostrarConsultas(consultas) {
    const contenedor = document.getElementById('lista-consultas');
    
    if (!contenedor) return;

    if (consultas.length === 0) {
        contenedor.innerHTML = '<p>No hay consultas enviadas</p>';
        return;
    }

    contenedor.innerHTML = consultas.map(consulta => `
        <div class="consulta-card">
            <h4>${consulta.asunto}</h4>
            <p>${consulta.mensaje}</p>
            <p><strong>Estado:</strong> <span class="estado-${consulta.estado}">${consulta.estado}</span></p>
            ${consulta.respuesta ? `<p><strong>Respuesta:</strong> ${consulta.respuesta}</p>` : ''}
            <small>Enviado: ${new Date(consulta.fechaCreacion).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// ==================== FUNCIONES DE TRANSPORTE ====================

// --- FUNCIÓN PARA ENVIAR A LA API ---
async function solicitarTransporte(direccion, fecha, hora, mascota, descripcion) {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/transporte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenUsuario}`
            },
            body: JSON.stringify({ direccion, fecha, hora, mascota, descripcion })
        });

        const datos = await respuesta.json();

        // 🟢 REGISTRO EN CONSOLA: Aquí verás lo que responde tu servidor
        console.log("Respuesta del servidor (Transporte):", datos);

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al solicitar transporte', 'error');
            return false;
        }

        mostrarAlerta('Transporte solicitado con éxito', 'exito');
        // cargarTransportes();
        return true;

    } catch (error) {
        console.error('Error en solicitarTransporte:', error);
        return false;
    }
}

// --- ESCUCHADOR DEL FORMULARIO ---
document.addEventListener('DOMContentLoaded', () => {
    const formTransporte = document.getElementById('transporte-form');

    if (formTransporte) {
        formTransporte.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Captura de datos
            const direccion = document.getElementById('direccion').value;
            const fecha = document.getElementById('fecha').value;
            const hora = document.getElementById('hora').value;
            const mascota = document.getElementById('mascota').value;
            const descripcion = document.getElementById('descripcion').value;

            // 🟢 REGISTRO EN CONSOLA: Ver lo que el usuario escribió
            console.log("📤 Intentando registrar transporte:", { 
                direccion, fecha, hora, mascota, descripcion 
            });

            const exito = await solicitarTransporte(direccion, fecha, hora, mascota, descripcion);

            if (exito) {
                formTransporte.reset();
                const statusDiv = document.getElementById('status');
                if (statusDiv) {
                    statusDiv.textContent = 'Solicitud enviada exitosamente.';
                    statusDiv.style.display = 'block';
                }
            }
        });
    }
});
// ==================== FUNCIONES DE CIRUGÍAS ====================
// Función para capturar el clic en las tarjetas y llevar al usuario al formulario
function solicitarServicio(nombreServicio) {
    // 1. Buscamos el formulario y el select
    const formulario = document.getElementById('seccion-reserva-cirugia');
    const selectorTipo = document.getElementById('tipo-cirugia');

    if (formulario) {
        // 2. Hace que la página baje suavemente hasta el formulario
        formulario.scrollIntoView({ behavior: 'smooth' });

        // 3. Si el servicio clickeado coincide con una opción del select, lo selecciona
        if (selectorTipo) {
            // Convertimos a minúsculas para comparar mejor o buscamos coincidencias
            const opciones = Array.from(selectorTipo.options);
            const opcionCoincidente = opciones.find(opt => 
                nombreServicio.toLowerCase().includes(opt.value.toLowerCase()) ||
                opt.value.toLowerCase().includes(nombreServicio.toLowerCase())
            );

            if (opcionCoincidente) {
                selectorTipo.value = opcionCoincidente.value;
                // Efecto visual de resaltado temporal al selector
                selectorTipo.style.borderColor = '#667eea';
                setTimeout(() => selectorTipo.style.borderColor = '#edf2f7', 2000);
            }
        }
        
        console.log(`Navegando a reserva para: ${nombreServicio}`);
    } else {
        console.error("No se encontró la sección de reserva de cirugía.");
    }
}


async function reservarCirugia(mascota, tipo, fechaProgramada, descripcion) {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/cirugias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenUsuario}`
            },
            body: JSON.stringify({
                mascota,
                tipo,
                fechaProgramada,
                descripcion
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al reservar cirugía', 'error');
            return false;
        }

        mostrarAlerta(datos.mensaje, 'exito');
        cargarCirugias();
        return true;

    } catch (error) {
        console.error('Error en reservarCirugia:', error);
        mostrarAlerta('Error de conexión', 'error');
        return false;
    }
}

async function cargarCirugias() {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/cirugias`, {
            headers: {
                'Authorization': `Bearer ${tokenUsuario}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al obtener cirugías');
        }

        const cirugias = await respuesta.json();
        mostrarCirugias(cirugias);

    } catch (error) {
        console.error('Error en cargarCirugias:', error);
    }
}

function mostrarCirugias(cirugias) {
    const contenedor = document.getElementById('lista-cirugias');
    
    if (!contenedor) return;

    if (cirugias.length === 0) {
        contenedor.innerHTML = '<p>No hay cirugías reservadas</p>';
        return;
    }

    contenedor.innerHTML = cirugias.map(cirugia => `
        <div class="cirugia-card">
            <h4>Cirugía - ${cirugia.tipo}</h4>
            <p><strong>Mascota:</strong> ${cirugia.mascota}</p>
            <p><strong>Fecha Programada:</strong> ${cirugia.fechaProgramada}</p>
            <p><strong>Estado:</strong> <span class="estado-${cirugia.estado}">${cirugia.estado}</span></p>
            <p><strong>Descripción:</strong> ${cirugia.descripcion || '-'}</p>
            <small>Reservada: ${new Date(cirugia.fechaCreacion).toLocaleDateString()}</small>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded' ,() => {
    const form = document.getElementById('form-cirugia');

    if(form) {
        form.addEventListener('submit' , async (event) => {
            event.preventDefault();

            const mascota = document.getElementById('mascota').value;
            const tipo = document.getElementById('tipo').value;
            const fechaProgramadda = document.getElementById('fechaProgramada').value;
            const descripcion = document.getElementById('descripcion').value;

            console.log({ mascota, tipo, fechaProgramada, descripcion});

            await reservarCirugia(mascota, tipo, fechaProgramada, descripcion);
        
        });
    }
})

async function reservarCirugia(mascota, tipo, fechaProgramada, descripcion) {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/cirugias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenUsuario}`
            },
            body: JSON.stringify({
                mascota,
                tipo,
                fechaProgramada,
                descripcion
            })
        });

        const datos = await respuesta.json();

        // 🟢 ESTO ES LO QUE VERÁS EN CONSOLA AL RECIBIR RESPUESTA
        console.log("Respuesta del servidor:", datos);

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al reservar cirugía', 'error');
            return false;
        }

        mostrarAlerta('Reserva realizada con éxito', 'exito');
        cargarCirugias(); // Recarga la lista para ver la nueva cirugía
        return true;

    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarAlerta('Error de conexión con el servidor', 'error');
        return false;
    }
}

// Escuchador global para el formulario
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulario-cirugia'); // ID correcto según tu HTML

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Captura de datos usando los IDs de tu segundo código
            const mascota = document.getElementById('mascota').value.trim();
            const tipo = document.getElementById('tipo-cirugia').value;
            const fecha = document.getElementById('fecha-cirugia').value;
            const descripcion = document.getElementById('descripcion-cirugia').value.trim();

            // 🟢 LOG PARA VER QUÉ ESTÁS ENVIANDO
            console.log("Datos capturados para enviar:", { mascota, tipo, fecha, descripcion });

            const exito = await reservarCirugia(mascota, tipo, fecha, descripcion);
            
            if (exito) {
                form.reset();
            }
        });
    }
});

// ==================== FUNCIONES DE AUTENTICACIÓN ====================

function verificarAutenticacion() {
    if (!tokenUsuario) {
        mostrarAlerta('Por favor inicia sesión primero', 'error');
        setTimeout(() => {
            window.location.href = '../html/index.html';
        }, 1500);
        return false;
    }
    return true;
}

function mostrarMenuUsuario() {
    const menuDiv = document.createElement('div');
    menuDiv.className = 'menu-usuario';
    menuDiv.innerHTML = `
        <span>Bienvenido, ${usuarioActual.nombre}</span>
        <button onclick="cerrarSesion()">Cerrar Sesión</button>
    `;
    
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(menuDiv);
    }
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        tokenUsuario = null;
        usuarioActual = null;
        mostrarAlerta('Sesión cerrada', 'exito');
        setTimeout(() => {
            window.location.href = '../html/index.html';
        }, 1000);
    }
}


// ==================== FUNCIONES AUXILIARES ====================

function mostrarAlerta(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo}`;
    alerta.textContent = mensaje;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función auxiliar para capturar datos de formularios genéricos
function capturarDatosFormulario(formularioId) {
    const formulario = document.getElementById(formularioId);
    if (!formulario) return null;

    const formData = new FormData(formulario);
    const datos = {};
    
    formData.forEach((value, key) => {
        datos[key] = value;
    });

    return datos;
}

// Exportar funciones para uso en otros scripts
window.app = {
    reservarTurno,
    cargarTurnos,
    eliminarTurno,
    enviarConsulta,
    cargarConsultas,
    cargarTransporte,
    solicitarTransporte,
    reservarCirugia,
    cargarCirugias,
    cerrarSesion,
    verificarAutenticacion,
    mostrarAlerta,
    validarEmail
};

