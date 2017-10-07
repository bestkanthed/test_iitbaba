const mongoose = require('mongoose');
const relationMatrix = require('../matrix/relationMatrix');
// put asyncs at the right places
// like here in exec 
// Take care on where to find one and where to find many
const relationSchema = new mongoose.Schema({
  ldap1: String, //
  ldap2: String, // if here predicted is true means 2 predicted for 1
  predicted: Boolean,
  request:Boolean,
  relationship: Array,
  relation: Number // this is a number to capture the relation
}, { timestamps: true });

relationSchema.statics.createRelation = function createRelation(ldap1, ldap2) {
  return new Promise (async (resolve, reject) => {
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec(async (err, rel)=>{
      if(err) reject(err);
      if(!rel){
        this.model('Relation').create({ 
          ldap1: ldap1, 
          ldap2: ldap2,
          predicted: false,
          request: false,
          friends: false,
          relation: await relationMatrix.getRelation(ldap1, ldap2).catch(err=>{ reject(err); })
        }, (err, rel)=>{
          if(err) reject(err);
          resolve("created"); 
        });
      }
      else resolve("already exists");
    });
  });
};

relationSchema.statics.getRelationCoff = function getRelation(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.relation);
    });
  });
};

relationSchema.statics.getRelation = function getRelation(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel);
    });
  });
};

relationSchema.statics.areFriends = function areFriends(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.friends);
    });
  });
};

relationSchema.statics.getPredicted = function getPredicted(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.predicted);
    });
  });
};

relationSchema.statics.updateRelation = function updateRelation(ldap1, ldap2) {
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

relationSchema.statics.predicted = function predicted(ldap1, ldap2) {
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

relationSchema.statics.requestSent = function request(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      rel.request = true;
      rel.save((err) => {
        if(err) reject(err);
        resolve("request sent");
      });
    });
  });
};

relationSchema.statics.getRequestSent = function request(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.request);
    });
  });
};

relationSchema.statics.requestDelete = function request(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      rel.request = false;
      rel.save((err) => {
        if(err) reject(err);
        resolve("request deleted");
      });
    });
  });
};

relationSchema.statics.makeFriends = function makeFriends(ldap1, ldap2) {
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

relationSchema.statics.unfriend = function unfriend(ldap1, ldap2) {
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

relationSchema.statics.findMostRelatedUsers = function findMostRelatedUsers(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ ldap1: ldap},{},{sort:{ "relation" : -1} }).select('ldap2 -_id').exec((err, rel)=>{
      if(err) reject(err);
      let result = [];
      for(ldp of rel) result.push(ldp.ldap2);
      resolve(result);
    });
  });
};

relationSchema.statics.getLdapsOfPeopleWhoPredicted = function getLdapsOfPeopleWhoPredicted(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ ldap1: ldap, predicted:true },{},{sort:{ "createdAt" : -1} }).select('ldap2 -_id').exec((err, rel)=>{
      if(err) reject(err);
      console.log("Logging predicted people");
      console.log(rel);
      if(rel!=null){
        let result = [];
        for(ldp of rel) result.push(ldp.ldap2);
        resolve(result);
      } else resolve(false); 
    });
  });
};

relationSchema.statics.setRelationship = function setRelationship(ldap1, ldap2, relationship) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      rel.relationship = relationship;
      rel.save((err, r)=>{
        if(err) reject(err);
        resolve(rel.relationship);
      });
    });
  });
};

relationSchema.statics.getRelationship = function getRelationship(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel.relationship);
    });
  });
};

const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;