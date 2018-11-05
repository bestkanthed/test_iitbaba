const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  to: String,
  from: String,
  post: String,
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

const Feed = mongoose.model('Feed', postSchema);
module.exports = Feed;