const stagnationConstant = 1; // k in your formula
const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  mid: Number,
  salary: Number,
}, { timestamps: true });

salarySchema.statics.newSalary = function newSalary(mid, sal) {
  return new Promise ((resolve, reject) => {
    this.model('Salary').create({ mid: mid, sal:sal }, (err, sal) => {
      if(err) return reject(err);
      return resolve('created');
    });
  });
};

salarySchema.statics.updateSalaries = function updateSalaries(salaries) {
  // make the forr lopp in promises
  return new Promise ((resolve, reject) => {
    for(let i=0; i<salaries.length; i++){
      this.model('Salary').create({ mid: i, salary:salaries[i] }, (err, sal) => {
        if(err) return reject(err);
      }); 
    }
    resolve("created");  
  });
};

salarySchema.statics.getSalary = function getSalary(mid, sal) {
  return new Promise ((resolve, reject) => {
    this.model('Salary').findOne({ mid: mid },{},{sort:{ "createdAt" : -1} }).exec( (err, sal) => {
      if(err) return reject(err);
      if(sal) return resolve(sal.salary);
      else return resolve(null);
    });
  });
};

salarySchema.statics.getGraphNodes = function getGraphNodes() {
  return new Promise ((resolve, reject) => {
    this.model('Salary').find({},{},{sort:{ "createdAt" : -1} }).distinct('mid').exec( (err, allSalaries) => {
      if(err) return reject(err);
      let nodes = [];
      for(sal of allSalaries){
        nodes.push({
          id: sal.mid,
          sal: sal.salary
        });
      }
      resolve(nodes);
    });
  });
};

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;