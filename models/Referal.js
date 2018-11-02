const mongoose = require('mongoose')

const referalSchema = new mongoose.Schema({
    idReferedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idReferedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Referal = mongoose.model('Referal', referalSchema);
module.exports = Referal;