const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  ldap: String, // The one 
  from: String,
  name: String,
  seen: Boolean,
  clicked: Boolean,
  accepted: Boolean,
  rejected: Boolean
}, { timestamps: true });

requestSchema.statics.createRequest = function createRequest(ldap, from, name) {
  return new Promise ((resolve, reject) => {
    this.model('Request').create({ 
      ldap: ldap, 
      from: from,
      name: name,
      seen: false,
      clicked: false,
      accepted: false,
      rejected: false
    }, (err, requ)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

requestSchema.statics.deleteRequest = function deleteRequest(ldap, from) {
  return new Promise ((resolve, reject) => { 
    this.model('Request').remove({ ldap: ldap, from:from }, (err)=>{
      if(err) reject(err);
      resolve("removed");
    });
  });
};

requestSchema.statics.getRequest = function getRequest(ldap, from) {
  return new Promise ((resolve, reject) => { 
    this.model('Request').findOne({ ldap: ldap, from:from },{},{sort:{ "createdAt" : -1} }).exec((err, requ)=>{
      if(err) reject(err);
      resolve(requ);
    });
  });
};

requestSchema.statics.getRequests = function getRequests(ldap, no) {
  return new Promise ((resolve, reject) => { 
    this.model('Request').find({ ldap: ldap, accepted:false, rejected:false },{},{sort:{ "createdAt" : -1} }).limit(no).exec((err, requ)=>{
      if(err) reject(err);
      resolve(requ);
    });
  });
};

requestSchema.statics.seeRequests = function seeRequests(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('Request').find({ ldap : ldap, seen : false}, (err, reqs)=>{
      console.log("logging ldap from seeRequests");
      console.log(ldap);
      console.log("logging reqs from seeRequests");
      console.log(reqs);
      if(err) reject(err);
      for(req of reqs){
        req.seen = true;
        req.save((err)=>{
          if(err) reject(err);
        });
      }
      resolve("seen");  
    });
  });
};

requestSchema.statics.clickRequest = function clickRequest(id) {
  return new Promise ((resolve, reject) => { 
    this.model('Request').findOne({ _id : id }, (err, requ)=>{
      if(err) reject(err);
      requ.clicked = true;
      requ.save((err)=>{
        if(err) reject(err);
        resolve("clicked");
      });
    });
  });
};

requestSchema.statics.acceptRequest = function acceptRequest(id) {
  return new Promise ((resolve, reject) => { 
    console.log(id);
    this.model('Request').findOne({ _id : id }, (err, requ)=>{
      if(err) reject(err);
      requ.accepted = true;
      requ.save((err)=>{
        if(err) reject(err);
        resolve("accepted");
      });
    });
  });
};

requestSchema.statics.rejectRequest = function rejectRequest(id) {
  return new Promise ((resolve, reject) => { 
    this.model('Request').findOne({ _id : id }, (err, requ)=>{
      if(err) reject(err);
      requ.rejected = true;
      requ.save((err)=>{
        if(err) reject(err);
        resolve("rejected");
      });
    });
  });
};

// This is an instance of the model I have created that I exported.
const Request = mongoose.model('Request', requestSchema);
module.exports = Request;

//My first guess is to create fuctions that just return what's required hiding all the bullshit.
// Handle all the error internally