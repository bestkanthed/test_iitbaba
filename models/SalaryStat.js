const mongoose = require('mongoose');
const erf = require('math-erf');
const salaryStatSchema = new mongoose.Schema({ // This the mean and sigma of the current salariies to calculate the weight of the predictor
  mean : Number,
  std : Number,
  n : Number
}, { timestamps: true });

salaryStatSchema.statics.createSalaryStat = (salary) => {
  return new Promise ((resolve, reject) => {
      this.model('SalaryStat').create({ 
      mean: salary,
      std: 0,
      n: 1
    }, (err, pred)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

salaryStatSchema.statics.updateSalaryStatChangeEntry = (salaryOld, salaryNew) => {
  return new Promise ((resolve, reject) => {
    this.model('SalaryStat').findOne({},{},{sort:{ "createdAt" : -1} }).exec((err, salstat)=>{
      if(err) reject(err);

      let mean = salstat.mean + (salaryNew - salaryOld) / salstat.n; 
      let std = Math.sqrt((salaryNew * salaryNew - salaryOld * salaryOld + salstat.n * (salstat.mean*salstat.mean - mean*mean)) / (salstat.n - 1) + salstat.std*salstat.std); 
      this.model('SalaryStat').create({ 
        mean: mean,
        std: std,
        n: salstat.n
      }, (err, pred)=>{
        if(err) reject(err);
        resolve("created"); 
      });
    });
  });
};

salaryStatSchema.statics.updateSalaryStatNewEntry = (salary) => {
  return new Promise ((resolve, reject) => {
    this.model('SalaryStat').findOne({},{},{sort:{ "createdAt" : -1} }).exec((err, salstat)=>{
      if(err) reject(err);
      if(salstat == null){
        this.model('SalaryStat').create({ 
          mean: salary,
          std: 0,
          n: 1
        }, (err, pred)=>{
          if(err) reject(err);
          resolve("created"); 
        });
      }  
      let mean = (salstat.mean*salstat.n + salary) / (salstat.n + 1); 
      let std = Math.sqrt((1 - 1/salstat.n) * salstat.std * salstat.std + (salstat.n + 1)*(mean - salstat.mean)*(mean - salstat.mean)); 
      this.model('SalaryStat').create({ 
        mean: mean,
        std: std,
        n: salstat.n + 1
      }, (err, pred)=>{
        if(err) reject(err);
        resolve("updated"); 
      });
    });
  });
};

salaryStatSchema.statics.getSalaryWeight = (salary) => {
  return new Promise ((resolve, reject) => { 
    this.model('SalaryStat').findOne({},{},{sort:{ "createdAt" : -1} }).exec((err, salstat)=>{
      if(err) reject(err);
      let weight =  (1 + erf((salary - salstat.mean) / salstat.std)) / 2;
      resolve(weight);
    });
  });
};


const SalarytStat = mongoose.model('SalaryStat', salaryStatSchema);
module.exports = SalaryStat;