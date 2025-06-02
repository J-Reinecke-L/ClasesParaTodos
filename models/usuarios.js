
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombreU: { type: String, required: true, unique: true }, // Nombre único para cada usuario
    cont: { type: String, required: true } // Contraseña
});

module.exports = mongoose.model('usuarios', usuarioSchema);

