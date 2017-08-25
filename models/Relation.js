const mongoose = relire('mongoose');

const relationSchema = new mongoose.Schema({
  ldap1: String, //
  ldap2: String, // if here predicted is true means 2 predicted for 1
  predicted: Boolean,
  friends: Boolean,
  relation: Number
}, { timestamps: true });


relationSchema.statics.createRelation = async (ldap1, ldap2) => {
  return new Promise ((resolve, reject) => {
    this.model('relation').create({ 
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

relationSchema.statics.getRelations = (ldap, no) => {
  return new Promise ((resolve, reject) => { 
    this.model('relation').find({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).limit(no).exec((err, rel)=>{
      if(err) reject(err);
      resolve(rel);
    });
  });
}

relationSchema.statics.seen = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('relation').find({ _id : id }, (err, rel)=>{
      if(err) reject(err);
      rel.seen = true;
      rel.save((err)=>{
        if(err) reject(err);
        resolve("seen");
      });
    });
  });
};

relationSchema.statics.clicked = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ _id : id }, (err, rel)=>{
      if(err) reject(err);
      rel.clicked = true;
      rel.save((err)=>{
        if(err) reject(err);
        resolve("clicked");
      });
    });
  });
};

relationSchema.statics.accepted = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ _id : id }, (err, rel)=>{
      if(err) reject(err);
      rel.accepted = true;
      rel.save((err)=>{
        if(err) reject(err);
        resolve("accepted");
      });
    });
  });
};

relationSchema.statics.rejected = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Relation').find({ _id : id }, (err, rel)=>{
      if(err) reject(err);
      rel.rejected = true;
      rel.save((err)=>{
        if(err) reject(err);
        resolve("rejected");
      });
    });
  });
};

const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;  