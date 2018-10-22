const mongoose = require('mongoose');
const internshipSchema = new mongoose.Schema({
  companyId: String,
  position: String,
  jobDescription: String,
  stipend: Number,
  startDate: Date,
  duration: Number
}, { timestamps: true });

internshipSchema.statics.createInternship = function createInternship(internship) {
  return new Promise ((resolve, reject) => {
      this.model('Internship').create({
          companyId: internship.companyId,
          position: internship.position,
          jobDescription: internship.jobDescription,
          stipend: internship.stipend,
          startDate : internship.startDate,
          duration : internship.duration
      }, (err, internship) => {
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

internshipSchema.statics.updateInternship = function updateInternship(internship) {
  return new Promise ((resolve, reject) => { 
    this.model('Internship').findOne({_id : internship.id}).exec((err, intern)=>{
      if(err) reject(err);
      intern.position = internship.position;
      intern.jobDescription = internship.jobDescription;
      intern.stipend = internship.stipend;
      intern.startDate = internship.startDate;
      intern.duration = internship.duration;
    });
  });
};

internshipSchema.statics.getByCompanyId = function getInternship(companyId) {
  return new Promise ((resolve, reject) => { 
    this.model('Internship').find({companyId : companyId} , (err, internships) => {
      if(err) reject(err);
      return resolve(internships);
    });
  });
};

internshipSchema.statics.getInternship = function getInternship(id) {
  return new Promise ((resolve, reject) => { 
    this.model('Internship').findOne({_id : id} , (err, internship) => {
      if(err) reject(err);
      return resolve(internship);
    });
  });
};

internshipSchema.statics.getAllInternships = function getAllInternships() {
  return new Promise ((resolve, reject) => {
    this.model('Internship').find({} , (err, internships) => {
      if(err) reject(err);
      return resolve(internships);
    });
  });
};

const Internship = mongoose.model('Internship', internshipSchema);
module.exports = Internship;