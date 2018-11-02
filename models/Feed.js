const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  to: String,
  from: String,
  feed: String,
  salary: {
    new: Number,
    change: Number,
    percent: Number,
    color: String
  },
  link: String,
  seen: Boolean,
  clicked: Boolean
}, { timestamps: true })

const Feed = mongoose.model('Feed', feedSchema);
module.exports = Feed;