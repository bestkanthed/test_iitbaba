const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  ldap: String, // The one 
  from: String,
  seen: Boolean,
  clicked: Boolean,
  accepted: Boolean,
  rejected: Boolean
}, { timestamps: true });

requestSchema.statics.createRequest = (ldap, from) => {
  return new Promise ((resolve, reject) => {
    this.model('request').create({ 
      ldap: ldap, 
      from: from,
      seen: false,
      clicked: false,
      accepted: null,
      rejected: null
    }, (err, requ)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

requestSchema.statics.getRequests = (ldap, no) => {
  return new Promise ((resolve, reject) => { 
    this.model('request').find({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).limit(no).exec((err, requ)=>{
      if(err) reject(err);
      resolve(requ);
    });
  });
}

requestSchema.statics.seen = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('request').find({ _id : id }, (err, requ)=>{
      if(err) reject(err);
      requ.seen = true;
      requ.save((err)=>{
        if(err) reject(err);
        resolve("seen");
      });
    });
  });
};

requestSchema.statics.clicked = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Request').find({ _id : id }, (err, requ)=>{
      if(err) reject(err);
      requ.clicked = true;
      requ.save((err)=>{
        if(err) reject(err);
        resolve("clicked");
      });
    });
  });
};

requestSchema.statics.accepted = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Request').find({ _id : id }, (err, requ)=>{
      if(err) reject(err);
      requ.accepted = true;
      requ.save((err)=>{
        if(err) reject(err);
        resolve("accepted");
      });
    });
  });
};

requestSchema.statics.rejected = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Request').find({ _id : id }, (err, requ)=>{
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