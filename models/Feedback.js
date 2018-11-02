const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
    idFrom:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content:  String,
}, { timestamps: true })

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;