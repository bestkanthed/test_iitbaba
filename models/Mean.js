const mongoose = require('mongoose');
const meanSchema = new mongoose.Schema({
  total: Number,
  n: Number
}, { timestamps: true });

meanSchema.statics.newMean = function createMean(mean) {
  return new Promise ((resolve, reject) => {
      this.model('Mean').create(mean, (err, mean)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

meanSchema.statics.getMean = function getMean() {
  return new Promise ((resolve, reject) => { 
    this.model('Mean').findOne({},{},{sort:{ "createdAt" : -1} }).exec((err, mean)=>{
      if(err) reject(err);
      if(mean) return resolve(mean);
      else return resolve({total:0,n:0});
    });
  });
};

const Mean = mongoose.model('Mean', meanSchema);
module.exports = Mean;