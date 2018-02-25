const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const _ = require('lodash');

const userSchema = new mongoose.Schema({
  ldap: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  first_name: String,
  last_name: String,
  known: String,
  hobbies: String,
  skills: String,
  hostel: Number,
  room: String,
  from: String,
  dob: Date,
  contact: String,
  email: String,
  looking: String,
  
  google: String,
  facebook: String,
  twitter: String,
  linkedin: String,
  instagram: String,
  snapchat: String,

  complete: Number,

  mid: Number,

  img: {
    filename: String,
    mimetype: String
  },

  tokens: {
    access_token: String,
    token_type: String,
    expires_in: String,
    refresh_token: String,
    scope: String
  },

  profile: {
    id: Number,
    username: String,
    first_name: String,
    last_name: String,
    deg_type: String,
    profile_picture: String,
    sex: String,
    email: String,
    mobile: String,
    roll_number: String,
    contacts : Array,
    upload_picture: Boolean,
    insti_address: {
      id: Number,
      room: String,
      hostel: String,
      hostel_name: String,
    },

    program: {
      id: Number,
      department : String,
      department_name: String,
      join_year: Number,
      graduation_year: Number,
      degree: String,
      degree_name: String
    },
    secondary_emails: Array
  }  
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  if(!this.password) {
    cb(null, false);
  }
  else {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  }
  
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.ldap) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.ldap).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

userSchema.methods.initializeUser = function initializeUser(info){
  return new Promise ((resolve, reject) => { 
    this.profile.id =  info.id;
    this.profile.first_name =  info.first_name;
    this.profile.last_name = info.last_name;
    this.profile.username = info.username;
    this.profile.deg_type = info.type;
    this.profile.profile_picture = info.profile_picture;
    this.profile.sex = info.sex;
    this.profile.email = info.email;
    this.profile.mobile = info.mobile;
    this.profile.roll_number = info.roll_number;
    this.profile.contacts = info.contacts;
    if(info.insti_address){
      this.profile.insti_address.id = info.insti_address.id;
      this.profile.insti_address.room = info.insti_address.room;
      this.profile.insti_address.hostel = info.insti_address.hostel;
      this.profile.insti_address.hostel_name = info.insti_address.hostel_name;
    }
    if(info.program){    
      this.profile.program.id = info.program.id;
      this.profile.program.department = info.program.department;
      this.profile.program.department_name = info.program.department_name;
      this.profile.program.join_year = info.program.join_year;
      this.profile.program.graduation_year = info.program.graduation_year;
      this.profile.program.degree = info.program.degree;
      this.profile.program.degree_name = info.program.degree_name;
    }
    this.profile.secondary_emails = info.secondary_emails;
    this.save(err=>{
      if(err) reject(err);
      console.log("user saved");
      resolve("created");
    });
  });
};

userSchema.statics.getNo = function getNo(){
  return new Promise ((resolve, reject) => { 
    this.model('User').count((err, count)=>{
      if(err) reject(err);
      return resolve(count);
    });
  });
};

userSchema.statics.getUser = function getUser(ldap){
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({ ldap: ldap}).exec((err, user)=>{
      if(err) reject(err);
      resolve(user);
    });
  });
};

userSchema.statics.setMID = function setMID(ldap, mid){
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({ ldap: ldap }).exec((err, user)=>{
      if(err) reject(err);
      user.mid = mid;
      user.save((err, usr)=>{
        if(err) reject(err);
        return resolve('mid saved');
      });
    });
  });
};

userSchema.statics.setComplete = function setComplete(ldap, complete){
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({ ldap: ldap }).exec((err, user)=>{
      if(err) reject(err);
      user.complete = complete;
      user.save((err, usr)=>{
        if(err) reject(err);
        return resolve('complete saved');
      });
    });
  });
};

userSchema.statics.getUsers = function getUsers(ldaps) { // This is getting passed in a wrong way
  return new Promise ((resolve, reject) => {
    //console.log("logging ldaps");
    //console.log(ldaps);
    this.model('User').find({ ldap: {$in: ldaps} },{},{sort:{ "createdAt" : -1} }).exec((err, users)=>{
      if(err) reject(err);
      resolve(users);
    });
  });
};

userSchema.statics.getAllLdaps = function getAllLdaps(){
  return new Promise ((resolve, reject) => { 
    this.model('User').find({},{},{sort:{ "createdAt" : -1} }).select('ldap -_id').exec((err, ldaps)=>{
      if(err) reject(err);
      resolve(ldaps);
    });
  });
};

userSchema.statics.ifExists = function ifExists(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({ldap: ldap},{},{sort:{ "createdAt" : -1} }).exec((err, ldap)=>{
      if(err) reject(err);
      if(ldap) resolve(true);
      else resolve(false);
    });
  });
};

userSchema.statics.getSearchResult = function getSearchResult(query) {
  return new Promise ((resolve, reject) => { 
    console.log(query);
    let built_query = {complete : 3};
    if (query.degree) built_query['profile.program.degree'] = { $in: _.isArray(query.degree) ? query.degree : [query.degree] };
    if (query.year_of_joining) built_query['profile.program.join_year'] = { $in: _.isArray(query.year_of_joining) ? query.year_of_joining : [query.year_of_joining] };
    if (query.department) built_query['profile.program.department'] = { $in: _.isArray(query.department) ? query.department : [query.department] };
    if (query.hostel) built_query['profile.insti_address.hostel'] = { $in: _.isArray(query.hostel) ? query.hostel : [query.hostel] };
    if (query.sex) built_query['profile.sex'] = { $in: _.isArray(query.sex) ? query.sex : [query.sex] };
    if (query.rollno) built_query['profile.roll_number'] = query.rollno;
    if (query.mobile) built_query['profile.contacts'] = { $elemMatch: {number:query.mobile} };
    if (query.first_name) built_query['first_name'] = query.first_name;
    if (query.last_name) built_query['last_name'] = query.last_name;
    if (query.ldap) built_query['ldap'] = query.ldap;
    
    console.log("Logging query form get search results in users");
    console.log(built_query);
    
    this.model('User').find(built_query,{},{sort:{ "createdAt" : -1} }).exec((err, results)=>{
      if(err) reject(err);
      resolve(results);
    });
  });
};

userSchema.statics.getUserLdapByMID = function getUserLdapByMID(mid) {
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({mid: mid},{},{sort:{ "createdAt" : -1} }).exec((err, ldap)=>{
      if(err) reject(err);
      if(ldap) resolve(ldap.ldap);
      else resolve(null);
    });
  });
};

userSchema.statics.getUserMIDByLdap = function getUserMIDByLdap(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({ldap: ldap},{},{sort:{ "createdAt" : -1} }).exec((err, ldap)=>{
      if(err) reject(err);
      if(ldap) resolve(ldap.mid);
      else resolve(null);
    });
  });
};

userSchema.statics.getUserNameByMID = function getUserNameByMID(mid) {
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({mid: mid},{},{sort:{ "createdAt" : -1} }).exec((err, ldap)=>{
      if(err) reject(err);
      if(ldap) resolve(ldap.first_name+" "+ldap.last_name);
      else resolve(null);
    });
  });
};

userSchema.methods.setComplete = function setComplete(completeLevel) {
  return new Promise ((resolve, reject) => { 
    this.complete = completeLevel;
    this.save(err => {
      if(err) return reject(err);
      return resolve("updated");
    });
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;