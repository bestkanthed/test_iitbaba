const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  ldap: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

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

userSchema.statics.getUser = (ldap) => {
  return new Promise ((resolve, reject) => { 
    this.model('user').findOne({ ldap: ldap }).exec((err, user)=>{
      if(err) reject(err);
      resolve(user);
    });
  });
};

userSchema.statics.getUser = (ldaps) => {
  return new Promise ((resolve, reject) => { 
    this.model('user').find({ ldap: {$in: ldaps} },{},{sort:{ "createdAt" : -1} }).exec((err, users)=>{
      if(err) reject(err);
      resolve(users);
    });
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;