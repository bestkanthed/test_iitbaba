const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const _ = require('lodash');

const userSchema = new mongoose.Schema({
  ldap: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

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
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
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

userSchema.statics.initializeUser = function initializeUser(user, info){
  return new Promise ((resolve, reject) => { 
    user.profile.id =  info.id;
    user.profile.first_name =  info.first_name;
    user.profile.last_name = info.last_name;
    user.profile.username = info.username;
    user.profile.deg_type = info.type;
    user.profile.profile_picture = info.profile_picture;
    user.profile.sex = info.sex;
    user.profile.email = info.email;
    user.profile.mobile = info.mobile;
    user.profile.roll_number = info.roll_number;
    user.profile.contacts = info.contacts;
    if(info.insti_address){
      user.profile.insti_address.id = info.insti_address.id;
      user.profile.insti_address.room = info.insti_address.room;
      user.profile.insti_address.hostel = info.insti_address.hostel;
      user.profile.insti_address.hostel_name = info.insti_address.hostel_name;
    }
    if(info.program){    
      user.profile.program.id = info.program.id;
      user.profile.program.department = info.program.department;
      user.profile.program.department_name = info.program.department_name;
      user.profile.program.join_year = info.program.join_year;
      user.profile.program.graduation_year = info.program.graduation_year;
      user.profile.program.degree = info.program.degree;
      user.profile.program.degree_name = info.program.degree_name;
    }
    user.profile.secondary_emails = info.secondary_emails;
    user.save(err=>{
      if(err) reject(err);
      resolve("created");
    });
  });
};

userSchema.statics.getUser = function getUser(ldap){
  return new Promise ((resolve, reject) => { 
    this.model('User').findOne({ ldap: ldap }).exec((err, user)=>{
      console.log("Logging from get user");
      console.log(user);
      if(err) reject(err);
      resolve(user);
    });
  });
};

userSchema.statics.getUsers = function getUsers(ldaps) { // This is getting passed in a wrong way
  return new Promise ((resolve, reject) => {
    console.log("logging ldaps");
    console.log(ldaps);
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
    
    var built_query = {};

    if (query.degree) built_query.program.degree = { $in: _.isArray(query.degree) ? query.degree : [query.degree] };
    if (query.year_of_joining) built_query.program.join_year = { $in: _.isArray(query.year_of_joining) ? query.year_of_joining : [query.year_of_joining] };
    if (query.department) built_query.program.department = { $in: _.isArray(query.department) ? query.department : [query.department] };
    if (query.hostel) built_query.insti_address.hostel = { $in: _.isArray(query.hostel) ? query.hostel : [query.hostel] };
    
    this.model('User').find({built_query},{},{sort:{ "createdAt" : -1} }).exec((err, results)=>{
      if(err) reject(err);
      resolve(results);
    });
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;