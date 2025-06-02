const express = require('express');
const mongoose = require('mongoose');
const Usuario = require('./models/usuarios'); 
const Estudiante = require('./models/estudiantes'); 
const path = require('path');
const bodyParser = require('body-parser'); 

const app = express();

// **Conexión a MongoDB**
require('dotenv').config();  // 🔹 Cargar variables del `.env`

mongoose.connect(process.env.DATABASE_URL, {  // 🔹 Usar la cadena de conexión correctamente
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, 
}).then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
}).catch((err) => {
    console.error('❌ Error al conectar a MongoDB Atlas:', err);
});


// **Middleware**
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===========================
// 🔹 **Rutas de Autenticación**
// ===========================

// 🔹 **Procesar Login**
app.post('/login', async (req, res) => {
    const { nombreU, cont } = req.body;

    try {
        const usuario = await Usuario.findOne({ nombreU });

        if (usuario && usuario.cont === cont) {
            return res.status(200).json({ 
                status: 'success', 
                message: 'Inicio de sesión exitoso.', 
                usuarioId: usuario._id.toString(), // Enviar ID al frontend
                redirect: '/main.html' 
            });
        } else {
            return res.status(401).json({ status: 'error', message: 'Usuario o contraseña incorrectos.' });
        }
    } catch (error) {
        console.error('❌ Error al procesar el login:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});


// 🔹 **Registrar Usuario**
app.post('/crear-usuario', async (req, res) => {
    const { nombreU, cont } = req.body;

    if (!nombreU || !cont) {
        return res.status(400).send('Por favor, llena todos los campos obligatorios.');
    }

    try {
        const usuarioExistente = await Usuario.findOne({ nombreU });

        if (usuarioExistente) {
            return res.status(400).send('El nombre de usuario ya está en uso.');
        }

        const nuevoUsuario = new Usuario({ nombreU, cont });
        await nuevoUsuario.save();

        res.status(201).send('Usuario registrado exitosamente.');
    } catch (error) {
        console.error('❌ Error al registrar usuario:', error);
        res.status(500).send('Error al registrar usuario.');
    }
});

// ===========================
// 🔹 **CRUD de Estudiantes**
// ===========================

// 🔹 **Registrar Estudiante**
app.post('/crear-estudiante', async (req, res) => {
    console.log("📩 Datos recibidos en el backend:", req.body); // 👈 Verificar si `clases` está presente

    let { nombre, caracteristicas, usuarioId, clases } = req.body;

    if (!nombre || !caracteristicas || caracteristicas.length === 0 || !usuarioId) {
        return res.status(400).json({ exito: false, mensaje: "❌ Faltan datos obligatorios." });
    }

    if (usuarioId.length !== 24) { 
        return res.status(400).json({ exito: false, mensaje: "❌ ID de usuario inválido." });
    }

    try {
        usuarioId = new mongoose.Types.ObjectId(usuarioId);

        console.log("📂 Clases recibidas en el backend:", clases); // 👈 Validar que `clases` existe

        const nuevoEstudiante = new Estudiante({ nombre, caracteristicas, usuario: usuarioId, clases });
        await nuevoEstudiante.save();

        res.status(201).json({ exito: true, mensaje: "✅ Estudiante registrado exitosamente.", estudiante: nuevoEstudiante });
    } catch (error) {
        console.error("❌ Error al registrar estudiante:", error);
        res.status(500).json({ exito: false, mensaje: "❌ Error interno del servidor." });
    }
});



// 🔹 **Obtener Estudiantes por Usuario**
app.get('/estudiantes/:usuarioId', async (req, res) => {
    let { usuarioId } = req.params;

    console.log("🔎 Usuario ID recibido:", usuarioId);

    if (usuarioId.length !== 24) { 
        return res.status(400).send('❌ ID de usuario inválido.');
    }

    try {
        usuarioId = new mongoose.Types.ObjectId(usuarioId);
        const estudiantes = await Estudiante.find({ usuario: usuarioId });

        console.log("📂 Estudiantes encontrados:", estudiantes);
        res.status(200).json(estudiantes);
    } catch (error) {
        console.error("❌ Error al obtener estudiantes:", error);
        res.status(500).send(`Error interno al obtener estudiantes: ${error.message}`);
    }
});

// 🔹 **Eliminar Estudiante**
app.delete('/eliminar-estudiante/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || id.length !== 24) {
        return res.status(400).json({ exito: false, mensaje: "ID de estudiante inválido." });
    }

    try {
        const resultado = await Estudiante.findByIdAndDelete(id);

        if (!resultado) {
            return res.status(404).json({ exito: false, mensaje: "Estudiante no encontrado." });
        }

        res.status(200).json({ exito: true, mensaje: "Estudiante eliminado correctamente." }); // 🔹 Sin emojis
    } catch (error) {
        console.error("Error al eliminar estudiante:", error);
        res.status(500).json({ exito: false, mensaje: "Error interno del servidor." });
    }
});





app.put('/editar-estudiante/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, caracteristicas, clases } = req.body;

    console.log("📩 Datos recibidos en el backend:", { nombre, caracteristicas, clases }); // 👈 Verificar antes de actualizar

    try {
        const estudianteActualizado = await Estudiante.findByIdAndUpdate(
            id, 
            { 
                nombre, 
                caracteristicas, 
                clases: Array.isArray(clases) ? clases : [] // 🔥 Asegurar que `clases` siempre sea un array
            }, 
            { new: true, overwrite: true } // 👈 Forzar la sobrescritura
        );

        console.log("📩 Estudiante actualizado en MongoDB:", estudianteActualizado); // 👈 Verificar después de actualizar

        if (!estudianteActualizado) {
            return res.status(404).send("❌ Estudiante no encontrado.");
        }

        res.status(200).send("✅ Estudiante actualizado correctamente.");
    } catch (error) {
        console.error("❌ Error al editar estudiante:", error);
        res.status(500).send("Error interno al editar estudiante.");
    }
});

app.delete('/eliminar-estudiante/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await Estudiante.findByIdAndDelete(id);
        res.status(200).send("Estudiante eliminado exitosamente.");
    } catch (error) {
        console.error("❌ Error al eliminar estudiante:", error);
        res.status(500).send("Error interno al eliminar estudiante.");
    }
});



// ===========================
// 🚀 **Iniciar Servidor**
// ===========================

const PORT = process.env.PORT || 8080;  // 🔹 Usará el puerto asignado por Railway o 3000


app.listen(PORT, () => {
    console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
});
