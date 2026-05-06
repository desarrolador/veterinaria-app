// ==================== CONFIGURACIÓN ====================
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
                'Authorization': `Bearer ${tokenUsuario}`
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

async function solicitarTransporte(direccion, fecha, hora, mascota, descripcion) {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/transporte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenUsuario}`
            },
            body: JSON.stringify({
                direccion,
                fecha,
                hora,
                mascota,
                descripcion
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarAlerta(datos.error || 'Error al solicitar transporte', 'error');
            return false;
        }

        mostrarAlerta(datos.mensaje, 'exito');
        cargarTransportes();
        return true;

    } catch (error) {
        console.error('Error en solicitarTransporte:', error);
        mostrarAlerta('Error de conexión', 'error');
        return false;
    }
}

async function cargarTransportes() {
    if (!verificarAutenticacion()) return;

    try {
        const respuesta = await fetch(`${API_URL}/transporte`, {
            headers: {
                'Authorization': `Bearer ${tokenUsuario}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al obtener transportes');
        }

        const transportes = await respuesta.json();
        mostrarTransportes(transportes);

    } catch (error) {
        console.error('Error en cargarTransportes:', error);
    }
}

function mostrarTransportes(transportes) {
    const contenedor = document.getElementById('lista-transportes');
    
    if (!contenedor) return;

    if (transportes.length === 0) {
        contenedor.innerHTML = '<p>No hay solicitudes de transporte</p>';
        return;
    }

    contenedor.innerHTML = transportes.map(transporte => `
        <div class="transporte-card">
            <h4>Transporte para: ${transporte.mascota}</h4>
            <p><strong>Dirección:</strong> ${transporte.direccion}</p>
            <p><strong>Fecha:</strong> ${transporte.fecha}</p>
            <p><strong>Hora:</strong> ${transporte.hora}</p>
            <p><strong>Estado:</strong> <span class="estado-${transporte.estado}">${transporte.estado}</span></p>
            <p><strong>Descripción:</strong> ${transporte.descripcion || '-'}</p>
            <small>Solicitado: ${new Date(transporte.fechaCreacion).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// ==================== FUNCIONES DE CIRUGÍAS ====================

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
    solicitarTransporte,
    cargarTransportes,
    reservarCirugia,
    cargarCirugias,
    cerrarSesion,
    verificarAutenticacion,
    mostrarAlerta,
    validarEmail
};
