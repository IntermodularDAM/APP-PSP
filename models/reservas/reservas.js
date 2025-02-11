const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema({
    _id: String,
    id_usu: {type: String, ref: 'Usuario'},
    id_hab: {type: String, ref: 'Habitacions'},
    fecha_check_in: String,
    fecha_check_out: String,
    estado_reserva: String
}, { _id: false });

reservaSchema.pre('save', async function (next) {
    const reservas = this;
    if (!reservas.isNew) return next(); // Solo aplica a documentos nuevos

    try {
        // Busca el último documento ordenado por _id
        const lastReserva = await this.constructor
        .findOne({})
        .sort({ _id: -1 })
        .exec();

        let newId = 'R-001'; // Valor por defecto si no hay documentos

        if (lastReserva) {
            // Extrae la parte numérica del último _id
            const lastIdNumber = parseInt(lastReserva._id.split('-')[1], 10);
            // Incrementa el número y genera el nuevo _id
            newId = `R-${String(lastIdNumber + 1).padStart(3, '0')}`;
        }

        reservas._id = newId; // Asigna el nuevo _id al documento
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Reservas', reservaSchema);