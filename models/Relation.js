const mongoose = require('mongoose');
const relationMatrix = require('../matrix/relationMatrix');
// put asyncs at the right places
// like here in exec 
// Take care on where to find one and where to find many
const relationSchema = new mongoose.Schema({
  ldap1: String, //
  ldap2: String, // if here predicted is true means 2 predicted for 1
  predicted: Boolean,
  friends: Boolean,
  relation: Number // this is a number to capture the relation
}, { timestamps: true });

relationSchema.statics.createRelation = (ldap1, ldap2) => {
  return new Promise (async (resolve, reject) => {
    this.model('Relation').create({ 
      ldap1: ldap1, 
      ldap2: ldap2,
      predicted: false,
      friends: false,
      relation: await relationMatrix.getRelation(ldap1, ldap2).catch(err=>{ reject(err); })
    }, (err, rel)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

relationSchema.statics.getRelation = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.relation);
    });
  });
};

relationSchema.statics.areFriends = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.friends);
    });
  });
};

relationSchema.statics.getPredictied = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.predicted);
    });
  });
};

relationSchema.statics.updateRelation = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec(async (err, rel)=>{
      if(err) reject(err);
      rel.relation = await relationMatrix.getRelation(ldap1, ldap2).catch(err=>{ reject(err); })
      rel.save((err) => {
        if(err) reject(err);
        resolve("updated");
      });
    });
  });
};

relationSchema.statics.predicted = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      rel.predicted = true;
      rel.save((err) => {
        if(err) reject(err);
        resolve("predicted");
      });
    });
  });
};

relationSchema.statics.makeFriends = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      rel.friends = true;
      rel.save((err) => {
        if(err) reject(err);
        resolve("friends");
      });
    });
  });
};

relationSchema.statics.unfriend = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      rel.friends = false;
      rel.save((err) => {
        if(err) reject(err);
        resolve("unfriended");
      });
    });
  });
};

relationSchema.statics.findMostRelatedUsers = (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ ldap1: ldap1},{},{sort:{ "relation" : -1} }).select('ldap2 -_id').exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel);
    });
  });
};

Realtion.getLdapsOfPeopleWhoPredicted = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap, predicted:true },{},{sort:{ "createdAt" : -1} }).select('ldap2 -_id').exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel);
    });
  });
};
const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;