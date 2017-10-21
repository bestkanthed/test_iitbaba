const mongoose = require('mongoose');

const kPointSchema = new mongoose.Schema({
  ldap1: String,
  ldap2: String,
  k: Number
}, { timestamps: true });

kPointSchema.statics.createKPoint = function createKPoint(ldap, predictor, k) {
  return new Promise ((resolve, reject) => {
      this.model('KPoint').create({ 
      ldap1: ldap, 
      ldap2: predictor, 
      k: k
    }, (err, kp)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

kPointSchema.statics.getKPoint = function getPrediction(ldap, predictor) {
  return new Promise ((resolve, reject) => {
    this.model('KPoint').findOne({ldap1:ldap, ldap2:predictor}, {},{sort:{ "createdAt" : -1} }).exec((err, kp)=>{
      if(err) reject(err);
      resolve(kp.k);
    });
  });
};

const KPoint = mongoose.model('KPoint', kPointSchema);
module.exports = KPoint;