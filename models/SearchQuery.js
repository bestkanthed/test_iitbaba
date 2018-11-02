const mongoose = require('mongoose');

const searchQuerySchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  query: String,
})

const SearchQuery = mongoose.model('SearchQuery', searchQuerySchema);
module.exports = SearchQuery;