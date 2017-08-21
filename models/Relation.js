const mongoose = require('mongoose');

const relationSchema = new mongoose.Schema({
  ldap1: String,
  ldap2: String,
  relation: Number,
  predicted: Boolean,
  friends: Boolean
}, { timestamps: true });

const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;  