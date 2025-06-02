const mongoose = require('mongoose');

const estudianteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    clases: [{ type: String, required: true }],  // Ahora es un array
    caracteristicas: [{ type: String }]
});


module.exports = mongoose.model('Estudiante', estudianteSchema);
