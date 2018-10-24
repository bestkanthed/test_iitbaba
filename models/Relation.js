const mongoose = require('mongoose');
const relationMatrix = require('../matrix/relationMatrix');
const User = require('./User');
const _ = require('lodash');

// put asyncs at the right places
// like here in exec 
// Take care on where to find one and where to find many
const relationSchema = new mongoose.Schema({
  idUser1:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  idUser2:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ldap1: String, //
  ldap2: String, // if here predicted is true means 2 predicted for 1
  predicted: Boolean,
  request: Boolean,
  relationship: Array,
  relation: Number // this is a number to capture the relation
}, { timestamps: true });

relationSchema.statics.createRelation = function createRelation(ldap1, ldap2, idUser1, idUser2) {
  return new Promise (async (resolve, reject) => {
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec(async (err, rel)=>{
      if(err) reject(err);
      if(!rel){
        this.model('Relation').create({
          idUser1,
          idUser2,
          ldap1: ldap1,
          ldap2: ldap2,
          predicted: false,
          request: false,
          friends: false,
          relation: await relationMatrix.getRelation(ldap1, ldap2)
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
      if(rel) return resolve(rel.predicted);
      else resolve(false);
    });
  });
};

relationSchema.statics.updateRelation = function updateRelation(ldap1, ldap2) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').findOne({ ldap1: ldap1, ldap2: ldap2 },{},{sort:{ "createdAt" : -1} }).exec(async (err, rel)=>{
      if(err) reject(err);
      rel.relation = await relationMatrix.getRelation(ldap1, ldap2);
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
    this.model('Relation').find({ ldap2: ldap, predicted: false},{},{sort:{ "relation" : -1} }).select('ldap1 -_id').exec((err, rel)=>{
      if(err) return reject(err);
      let result = [];
      for(ldp of rel) result.push(ldp.ldap1);
      return resolve(result);
    });
  });
};

relationSchema.statics.getLdapsOfPeopleWhoPredicted = function getLdapsOfPeopleWhoPredicted(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ ldap1: ldap, predicted:true },{},{sort:{ "createdAt" : -1} }).select('ldap2 -_id').exec((err, rel)=>{
      if(err) reject(err);
      //console.log(rel);
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
      if(err) return reject(err);
      if(rel) return resolve(rel.relationship);
      else resolve("no");
    });
  });
};

relationSchema.statics.getGraphLinks = function getGraphLinks() {
  return new Promise ((resolve, reject) => {
    this.model('Relation').find({}, async (err, allRel)=>{
      if(err) reject(err);
      //console.log("Logging all predictions ", allPredictions);      
      let links = [];

      for(rel of allRel){
        //console.log("Logging relation", rel);
        let link = {};
        let relCoff = 0;
        if(rel.predicted) link.predicted = true;
        if(rel.relationship){
          if (rel.relationship.length){
            //console.log("Logging reltionship", rel.relationship);
            let relationship='';
            for(relL of rel.relationship){
              if(relL=='Best') relCoff=relCoff+3;
              if(relL=='Ex') relCoff=relCoff-0.3;
              if(relL=='Roommate') relCoff=relCoff+2;
              if(relL=='Wingmate') relCoff=relCoff+1;
              if(relL=='Inmate') relCoff=relCoff+0.1;
              if(relL=='Friend') relCoff=relCoff+0.5;
              if(relL=='Girlfriend') relCoff=relCoff+2.5;
              if(relL=='Boyfriend') relCoff=relCoff+2.5;
              if(relL=='Crush') relCoff=relCoff+3;
              if(relL=='Classmate') relCoff=relCoff+0.25;
              if(relL=='Batchmate') relCoff=relCoff+0.1;
              if(relL=='Teammate') relCoff=relCoff+1;
              relationship = relationship + " "+relL;
            }
            link.relationship = relationship;
          }
        }
        if(!_.isEmpty(link)){
          let source = await User.getUserMIDByLdap(rel.ldap2);
          let target = await User.getUserMIDByLdap(rel.ldap1);
          if (source) link.source = source.toString();
          else link.source = "1";
          if (target) link.target = target.toString();
          else link.target = "1";
          link.value = relCoff;
          links.push(link);
        }
      }
      //console.log("Logging links ", links);
      return resolve(links);
    });
  });
};
const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;