const mongoose = require('mongoose');

const kPointSchema = new mongoose.Schema({
  ldap1: String,
  ldap2: String,
  k: Number
}, { timestamps: true });

kPointSchema.statics.createKPoint = (ldap, predictor, k) => {
  return new Promise ((resolve, reject) => {
      this.model('kPoint').create({ 
      ldap1: ldap, 
      ldap2: predictor, 
      k: k
    }, (err, kp)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

const kPoint = mongoose.model('kPoint', kPointSchema);
module.exports = kPoint;