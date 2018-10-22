const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  name: {type : String, unique: true},
  mission: String,
  address: String,
  website: String,
  contactPerson: String,
  contactNo: Number,
  contactEmail: String // Check email
}, { timestamps: true });

companySchema.statics.newCompany = function createCompany(company) {
  return new Promise ((resolve, reject) => {
      this.model('Company').create({
          name : company.name,
          mission : company.mission,
          address : company.address,
          website : company.website,
          contactPerson : company.contactPerson,
          contactNo : company.contactNo,
          contactEmail : company.contactEmail
      }, (err, company)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

companySchema.statics.updateCompany = function updateCompany(company) {
  return new Promise ((resolve, reject) => {
      this.model('Company').findOne({name : company.name} ,(err, comp) => {
        if(err) reject(err);
        comp.name = company.name,
        comp.mission = company.mission,
        comp.address = company.address,
        comp.website = company.website,
        comp.contactPerson = company.contactPerson,
        comp.contactNo = company.contactNo,
        comp.contactEmail = company.contactEmail
        comp.save((err) => {
            if(err) reject(err);
            resolve("created"); 
        });
    });
  });
};

companySchema.statics.getCompany = function getCompany(id) {
  return new Promise ((resolve, reject) => { 
    this.model('Company').findOne({_id: id} ,(err, company)=>{
      if(err) reject(err);
      return resolve(company);
    });
  });
};

companySchema.statics.getAll = function getAll() {
  return new Promise ((resolve, reject) => { 
    this.model('Company').find({} ,(err, company)=>{
      if(err) reject(err);
      return resolve(company);
    });
  });
};

const Company = mongoose.model('Company', companySchema);
module.exports = Company;