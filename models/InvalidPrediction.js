const mongoose = require('mongoose');

const invalidPredictionSchema = new mongoose.Schema({
  mid1: Number,
  mid2: Number,
  invalidPrediction: Number
}, { timestamps: true });

invalidPredictionSchema.statics.create = function create(mid1, mid2, invalidPrediction) {
  return new Promise ((resolve, reject) => {
      this.model('InvalidPrediction')({
      mid1: mid1,
      mid2: mid2,
      invalidPrediction: invalidPrediction
    }).save((err, pred) => {
      if(err) reject(err);
      return resolve("created"); 
    });
  });
};

const InvalidPrediction = mongoose.model('InvalidPrediction', invalidPredictionSchema);
module.exports = InvalidPrediction;