const mongoose = require('mongoose');
const Currentstat = require('./Currentstat');

const salarySchema = new mongoose.Schema({
  ldap: String,
  salary: Number, // Not pure
  mean: Number, // Pure mean of all the predictions till now
  std: Number, // Pure standard deviation of all the predictions till now
  n: Number // one more than no of people who have predicted till now
}, { timestamps: true });

salarySchema.statics.createSalary = (ldap, salary, std) => {
  return new Promise ((resolve, reject) => {
      this.model('Salary').create({ 
      ldap: ldap, 
      salary: salary,
      mean: salary,
      std: std,
      n: 1
    }, (err, pred)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

salarySchema.statics.updateSalary = (ldap, prediction) => {
  return new Promise ((resolve, reject) => {
    this.model('Salary').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, sal)=>{
      let mean = (sal.mean*sal.n + prediction) / (sal.n + 1)
      let std = (1 - 1/sal.n) * sal.std * sal.std + (sal.n + 1)*(mean - sal.mean)*(mean - sal.mean);
      let salary = 
      this.model('Salary').create({ 
        ldap: ldap, 
        salary: salary,
        mean: salary,
        std: std,
        n: 1
      }, (err, pred)=>{
        if(err) reject(err);
        resolve("created"); 
      });
    });
  });
};

salarySchema.statics.getSalary = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Salary').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, sal)=>{
      if(err) reject(err);
      resolve(sal.salary);
    });
  });
};

salarySchema.statics.getMean = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Salary').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, sal)=>{
      if(err) reject(err);
      resolve(sal.mean);
    });
  });
};

salarySchema.statics.getStd = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Salary').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, sal)=>{
      if(err) reject(err);
      resolve(sal.std);
    });
  });
};

salarySchema.statics.getNoOfPredictionsFor = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Salary').findOne({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).exec((err, sal)=>{
      if(err) reject(err);
      resolve(sal.n);
    });
  });
};

salarySchema.pre('save', function save(next) {
  
  // Adding error handler to places
  // When we current salary is added for someone then the stats of the current salary must be update.
  // The way to do that is to get the old current salary of the person
  // if it exists remove it from the set and add the new current salary to calculate the new current stats for the current salaries
  // if it dosen't exist then it means that this is initialization for the person, then it 
  // it is possilbe he is the first person on the planet, in this case old Current stats won't exist so you'll have to create them
  // or if it's the other case then you'll have a new point in the new current salary stats 
  const salary = this;
  let old_sal_l1;

  let getOldSalary  = new Promise(function(resolve, reject) {
    Salary.findOne({ldap : salary.ldap}, {}, { sort: { 'createdAt' : -1 } }, function(err, salary_o) {
        if (err) return next(err);
        if(!salary_o) reject("First entry");  
        else {
          old_sal_l1 = salary_o.salary;
          resolve("Not first");
        }
    });
  });
  // Not first prediction for , hence not the new current salary
  getOldSalary.then((result)=>{
    let old_stats;
    
    let getCurrentSalaryStats  = new Promise(function(resolve, reject) {
      Currentstat.findOne({}, {}, { sort: { 'createdAt' : -1 } }, function(err, stats) {
        if (err) { return next(err); reject(err);}
        else {
          old_stats = stats;
          resolve("Got old stats");
        }
      });  
    });
    
    getCurrentSalaryStats.then((result)=>{
      var new_mean = old_stats.mean + (salary.salary - old_sal_l1)/old_stats.size;
      console.log("stat_size");
      console.log(old_stats.size);
      console.log(old_stats);
      var new_sigma = Math.sqrt( (salary.salary*salary.salary - old_sal_l1*old_sal_l1 + old_stats.size*(old_stats.mean*old_stats.mean - new_mean*new_mean))/(old_stats.size - 1) + old_stats.sigma*old_stats.sigma); 
      Currentstat.create({ mean: new_mean, sigma: new_sigma, size: old_stats.size}, function(err, stats) {
        if (err) return next(err);
        next();
      });
    },(err)=>{
      console.log(err);
    });
  }, (err)=>{

    let old_stats;
    let getCurrentSalaryStats1  = new Promise(function(resolve, reject) {
      Currentstat.findOne({}, {}, { sort: { 'createdAt' : -1 } }, function(err, o_stats) {
        if (err) { return next(err); reject(err);}
        if (o_stats) {old_stats = o_stats; resolve("Got old stats");}
        else reject("First one");
      });  
    });

    getCurrentSalaryStats1.then((result)=>{
      console.log("new Entry");
      var new_mean = (old_stats.mean*old_stats.size + salary.salary)/(old_stats.size + 1);
      var new_sigma = (old_stats.mean - new_mean)*(old_stats.mean - new_mean)*(old_stats.size + 1) + (1 - 1/old_stats.size)*old_stats.sigma;
      //var new_sigma = Math.sqrt( (salary.salary*salary.salary + old_stats.mean*old_stats.mean - new_mean*new_mean + (old_stats.size - 1)*old_stats.sigma*old_stats.sigma)/(old_stats.size)); 
      
      Currentstat.create({ mean: new_mean, sigma: new_sigma, size: old_stats.size + 1}, function(err, stats) {
        if (err) return next(err);
        next();
      });

    },(err)=>{
      console.log("this sal");
      Currentstat.create({ mean: salary.salary, sigma: 0, size: 1}, function(err, stats) {
        if (err) return next(err);
        console.log("no err");
        next();
      });
    });
  });
});

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;