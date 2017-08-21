const mongoose = require('mongoose');

const authenticitySchema = new mongoose.Schema({
  ldap: String,
  auth: Number
}, { timestamps: true });

const Authenticity = mongoose.model('Authenticity', authenticitySchema);
module.exports = Authenticity;