// For now I am making the most redundant algorthim you can imagine.
// I'll reason up from here.

const erf = require('math-erf');
const mongoose = require('mongoose');
const Salary = require('./Salary');
const Authenticity = require('./Authenticity');
const Currentstat = require('./Currentstat');

const predictionSchema = new mongoose.Schema({
  ldap1: String,
  ldap2: String,
  prediction: Number
}, { timestamps: true });

predictionSchema.statics.createPrediction = (ldap, predictor, salary) => {
  return new Promise ((resolve, reject) => {
      this.model('Prediction').create({ 
      ldap1: ldap, 
      ldap2: predictor, 
      prediction: salary
    }, (err, pred)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};


predictionSchema.post('save', function save(next) {
  const prediction = this;
  console.log(prediction);
  const lower_sal_coff = 0.3;
  var curr_sal_l1;
  var curr_sal_l2;
  var auth_l2;
  var sal_weight_l2;
  var new_auth;
  var n;

  let getL2Salary  = new Promise(function(resolve, reject) {
    Salary.findOne({ldap : prediction.ldap2},{},{ sort: { 'createdAt' : -1 } }, function(err, salary) {
      if (err) { reject(err); return next(err); }
      curr_sal_l2 = salary.salary;
      resolve("Got");
    });
  });

  let getCurrentSalaryStats  = new Promise(function(resolve, reject) {
    Currentstat.findOne({},{},{ sort: { 'createdAt' : -1 } }, function(err, stats) {
      if (err) { reject(err); return next(err); }
      if(stats.sigma) sal_weight_l2 = lower_sal_coff + ((1 - lower_sal_coff) / 2) * erf((curr_sal_l2 - stats.mean) / stats.sigma);
      else sal_weight_l2 = 0.5;
      resolve("Got");
    });
  });
  
  let getL2Auth  = new Promise(function(resolve, reject) {
    Authenticity.findOne({ldap : prediction.ldap2},{},{ sort: { 'createdAt' : -1 } }, function(err, auth) {
      if (err) { reject(err); return next(err); }
      auth_l2 = auth.auth;
      resolve("Got");
    });
  });

  let getL1SalPrams  = new Promise(function(resolve, reject) {
    Salary.findOne({ldap : prediction.ldap1},{},{ sort: { 'createdAt' : -1 } }, function(err, salary) {
      if (err) { reject(err); return next(err); }
      curr_sal_l1 = salary.salary;
      mean_old = salary.mean;
      sigma_old = salary.sigma;
      n = salary.n;
      if(salary.sigma) new_auth = 1 - erf( Math.abs(salary.mean - prediction.salary) / salary.sigma);
      else new_auth = 0.95;
      resolve("Got");
    });
  });

  Promise.all([getL1SalPrams, getL2Auth, getCurrentSalaryStats, getL2Salary]).then(values => { 
    console.log(new_auth);
    Authenticity.create({ ldap : prediction.ldap2, auth : new_auth}, function (err, small) {
      if (err) console.log(err);
    });

    Prediction.find({ldap1 : prediction.ldap1}, function(err, predictions) {
      if (err) console.log(err);
      for(pred of predictions){
          
        if (pred.ldap2 == prediction.ldap2) continue;
        let new_autho;
        let foundalreadyPred = new Promise((resolve,reject)=>{
          Salary.findOne({ldap: pred.ldap2},{},{ sort: { 'createdAt' : -1 } }, function(err, salary){
            if (err) { reject(err); return next(err); }
            if(salary.sigma) new_autho = 1 - erf( Math.abs(salary.mean - pred.salary) / salary.sigma);
            else new_autho = 0.95;
            resolve("found");
          });
        });

        foundalreadyPred.then((result)=>{
          Authenticity.create({ ldap : pred.ldap2, auth : new_autho}, function (err, small) {
            if (err) console.log(err);
          });
        }, (err)=>{console.log(err); });

      }
    });

    console.log(auth_l2);console.log(sal_weight_l2);console.log(curr_sal_l1);console.log(prediction.salary);console.log(mean_old);console.log(sigma_old);
    let weight = auth_l2*sal_weight_l2;
    let salary = curr_sal_l1 + Math.sqrt(weight)*(prediction.salary - curr_sal_l1);
    let mean = (mean_old*n + prediction.salary)/n+1;
    console.log("Nuking");
    console.log(mean); console.log(n); console.log(sigma_old); console.log(mean_old);
    let sigma = Math.sqrt( (1 - 1/n)*sigma_old*sigma_old + (n + 1)*(mean - mean_old)*(mean - mean_old));
    console.log(sigma);

    Salary.create({ ldap : prediction.ldap1, salary: salary , mean : mean, sigma : sigma, n: n+1}, function (err, small) {
      if (err) console.log(err);
    });
  });
});

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;