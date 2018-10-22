const mongoose = require('mongoose');

const PredStatsSchema = new mongoose.Schema({
  ldap: String,
  mu: Number,
  sigma: Number
}, { timestamps: true });

module.exports = LastPred;