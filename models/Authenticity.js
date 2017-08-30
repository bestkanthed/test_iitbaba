const mongoose = require('mongoose');

const authenticitySchema = new mongoose.Schema({
  ldap: String,
  auth: Number,
  mean: Number,
  std: Number,
  n: Number // No of people predicted by the ldap will be one less than this
}, { timestamps: true });

authenticitySchema.statics.createAuthenticity = (ldap, k) => { // the auth is initilized using k value
  return new Promise ((resolve, reject) => {
      this.model('Authenticity').create({ 
      ldap: ldap,
      auth : 1 - erf(Math.abs(k)) , 
      mean: k, 
      std: 0,
      n: 1
    }, (err, auth)=>{
      if(err) reject(err);
      resolve("created");
    });
  });
};

authenticitySchema.statics.updateAuthenticity = (ldap, kPoint) => {
  return new Promise ((resolve, reject) => {
    this.model('Authenticity').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, auth)=>{
      if(err) reject(err);
      let mean = (auth.mean*auth.n + authPoint)/(auth.n + 1);
      let std = (1 - 1/auth.n) * auth.std * auth.std + (auth.n + 1)*(mean - auth.mean)*(mean - auth.mean);
      this.model('Authenticity').create({ 
        ldap: ldap,
        auth: 1 - erf(Math.abs(mean)), 
        mean: mean, 
        std: std,
        n: auth.n + 1
      }, (err, aut)=>{
        if(err) reject(err);
        resolve("updated");
      });
    });
  });
};

authenticitySchema.statics.getAuthenticityOf = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Authenticity').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, auth)=>{
      if(err) reject(err);
      resolve(auth.mean);
    });
  });
};

authenticitySchema.statics.getAuthenticityStdOf = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Authenticity').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, auth)=>{
      if(err) reject(err);
      resolve(auth.std);
    });
  });
};

authenticitySchema.statics.getNoPeoplePredictedBy = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Authenticity').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, auth)=>{
      if(err) reject(err);
      resolve(auth.n);
    });
  });
};

const Authenticity = mongoose.model('Authenticity', authenticitySchema);
module.exports = Authenticity;