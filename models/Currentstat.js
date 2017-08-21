const mongoose = require('mongoose');

const currentStatsSchema = new mongoose.Schema({
  mean : Number,
  sigma : Number,
  size : Number
}, { timestamps: true });

const Currentstat = mongoose.model('Currentstat', currentStatsSchema);
module.exports = Currentstat;