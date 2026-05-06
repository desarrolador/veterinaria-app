const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'tu_clave_secreta_super_segura_2024';

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../')));

// Inicializar base de datos SQLite
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error al conectar la BD:', err);
    } else {
        console.log('Base de datos SQLite conectada');
        inicializarBD();
    }
});

// Crear tablas en la BD
function inicializarBD() {
    // Tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            aceptarEmail INTEGER DEFAULT 0,
            fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla de turnos
    db.run(`
        CREATE TABLE IF NOT EXISTS turnos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuarioId INTEGER NOT NULL,
            fecha DATE NOT NULL,
            hora TIME NOT NULL,
            tipo TEXT NOT NULL,
            mascota TEXT,
            descripcion TEXT,
            estado TEXT DEFAULT 'pendiente',
            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
        )
    `);

    // Tabla de consultas por email
    db.run(`
        CREATE TABLE IF NOT EXISTS consultas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuarioId INTEGER NOT NULL,
            asunto TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            estado TEXT DEFAULT 'pendiente',
            respuesta TEXT,
            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
        )
    `);

    // Tabla de transporte
    db.run(`
        CREATE TABLE IF NOT EXISTS transporte (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuarioId INTEGER NOT NULL,
            direccion TEXT NOT NULL,
            fecha DATE NOT NULL,
            hora TIME NOT NULL,
            mascota TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'pendiente',
            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
        )
    `);

    // Tabla de cirugías
    db.run(`
        CREATE TABLE IF NOT EXISTS cirugias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuarioId INTEGER NOT NULL,
            mascota TEXT NOT NULL,
            tipo TEXT NOT NULL,
            fechaProgramada DATE NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'pendiente',
            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
        )
    `);
}

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], SECRET_KEY);
        req.usuarioId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// ==================== RUTAS DE USUARIOS ====================

// Registro de usuario
app.post('/api/usuarios/registro', (req, res) => {
    const { nombre, email, password, confirmPassword, aceptarEmail } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Hashear la contraseña
    bcrypt.hash(password, 10, (err, passwordHash) => {
        if (err) {
            return res.status(500).json({ error: 'Error al procesar la contraseña' });
        }

        // Insertar usuario en la BD
        const query = `INSERT INTO usuarios (nombre, email, password, aceptarEmail) VALUES (?, ?, ?, ?)`;
        db.run(query, [nombre, email, passwordHash, aceptarEmail ? 1 : 0], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'El email ya está registrado' });
                }
                return res.status(500).json({ error: 'Error al registrar usuario' });
            }

            const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '7d' });
            res.status(201).json({ 
                mensaje: 'Usuario registrado exitosamente',
                token,
                usuario: { id: this.lastID, nombre, email }
            });
        });
    });
});

// Login de usuario
app.post('/api/usuarios/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const query = `SELECT * FROM usuarios WHERE email = ?`;
    db.get(query, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error al verificar contraseña' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Email o contraseña incorrectos' });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
            res.json({
                mensaje: 'Login exitoso',
                token,
                usuario: { id: user.id, nombre: user.nombre, email: user.email }
            });
        });
    });
});

// ==================== RUTAS DE TURNOS ====================

// Obtener todos los turnos del usuario
app.get('/api/turnos', verificarToken, (req, res) => {
    const query = `SELECT * FROM turnos WHERE usuarioId = ? ORDER BY fecha DESC`;
    db.all(query, [req.usuarioId], (err, turnos) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener turnos' });
        }
        res.json(turnos);
    });
});

// Crear nuevo turno
app.post('/api/turnos', verificarToken, (req, res) => {
    const { fecha, hora, tipo, mascota, descripcion } = req.body;

    if (!fecha || !hora || !tipo) {
        return res.status(400).json({ error: 'Fecha, hora y tipo son requeridos' });
    }

    const query = `INSERT INTO turnos (usuarioId, fecha, hora, tipo, mascota, descripcion) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [req.usuarioId, fecha, hora, tipo, mascota, descripcion], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al crear turno' });
        }

        res.status(201).json({
            mensaje: 'Turno registrado exitosamente',
            turnoId: this.lastID
        });
    });
});

// Actualizar turno
app.put('/api/turnos/:id', verificarToken, (req, res) => {
    const { fecha, hora, tipo, mascota, descripcion, estado } = req.body;
    const query = `UPDATE turnos SET fecha=?, hora=?, tipo=?, mascota=?, descripcion=?, estado=? 
                   WHERE id=? AND usuarioId=?`;
    
    db.run(query, [fecha, hora, tipo, mascota, descripcion, estado, req.params.id, req.usuarioId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar turno' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        res.json({ mensaje: 'Turno actualizado exitosamente' });
    });
});

// Eliminar turno
app.delete('/api/turnos/:id', verificarToken, (req, res) => {
    const query = `DELETE FROM turnos WHERE id=? AND usuarioId=?`;
    
    db.run(query, [req.params.id, req.usuarioId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar turno' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        res.json({ mensaje: 'Turno eliminado exitosamente' });
    });
});

// ==================== RUTAS DE CONSULTAS ====================

// Crear consulta por email
app.post('/api/consultas', verificarToken, (req, res) => {
    const { asunto, mensaje } = req.body;

    if (!asunto || !mensaje) {
        return res.status(400).json({ error: 'Asunto y mensaje son requeridos' });
    }

    const query = `INSERT INTO consultas (usuarioId, asunto, mensaje) VALUES (?, ?, ?)`;
    
    db.run(query, [req.usuarioId, asunto, mensaje], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al enviar consulta' });
        }

        res.status(201).json({
            mensaje: 'Consulta enviada exitosamente',
            consultaId: this.lastID
        });
    });
});

// Obtener consultas del usuario
app.get('/api/consultas', verificarToken, (req, res) => {
    const query = `SELECT * FROM consultas WHERE usuarioId = ? ORDER BY fechaCreacion DESC`;
    db.all(query, [req.usuarioId], (err, consultas) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener consultas' });
        }
        res.json(consultas);
    });
});

// ==================== RUTAS DE TRANSPORTE ====================

// Solicitar transporte
app.post('/api/transporte', verificarToken, (req, res) => {
    const { direccion, fecha, hora, mascota, descripcion } = req.body;

    if (!direccion || !fecha || !hora || !mascota) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const query = `INSERT INTO transporte (usuarioId, direccion, fecha, hora, mascota, descripcion) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [req.usuarioId, direccion, fecha, hora, mascota, descripcion], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al solicitar transporte' });
        }

        res.status(201).json({
            mensaje: 'Solicitud de transporte registrada',
            transporteId: this.lastID
        });
    });
});

// Obtener solicitudes de transporte
app.get('/api/transporte', verificarToken, (req, res) => {
    const query = `SELECT * FROM transporte WHERE usuarioId = ? ORDER BY fecha DESC`;
    db.all(query, [req.usuarioId], (err, transportes) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener transportes' });
        }
        res.json(transportes);
    });
});

// ==================== RUTAS DE CIRUGÍAS ====================

// Reservar cirugía
app.post('/api/cirugias', verificarToken, (req, res) => {
    const { mascota, tipo, fechaProgramada, descripcion } = req.body;

    if (!mascota || !tipo || !fechaProgramada) {
        return res.status(400).json({ error: 'Mascota, tipo y fecha son requeridos' });
    }

    const query = `INSERT INTO cirugias (usuarioId, mascota, tipo, fechaProgramada, descripcion) 
                   VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [req.usuarioId, mascota, tipo, fechaProgramada, descripcion], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al reservar cirugía' });
        }

        res.status(201).json({
            mensaje: 'Cirugía reservada exitosamente',
            cirugiaId: this.lastID
        });
    });
});

// Obtener cirugías del usuario
app.get('/api/cirugias', verificarToken, (req, res) => {
    const query = `SELECT * FROM cirugias WHERE usuarioId = ? ORDER BY fechaProgramada DESC`;
    db.all(query, [req.usuarioId], (err, cirugias) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener cirugías' });
        }
        res.json(cirugias);
    });
});

// ==================== MANEJO DE ERRORES ====================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✓ Servidor ejecutándose en http://localhost:${PORT}`);
});
