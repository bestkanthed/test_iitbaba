const passport = require('passport');
const User = require('../models/User');
const request = require('request');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Authenticity = require('../models/Authenticity');
const Salary = require('../models/Salary');

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  console.log("in login");
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('password', 'Password cannot be blank').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    console.log(user);
    if (err) { return next(err); }
    if (!user) {
      console.log("confirm");
      console.log(user);
      console.log("confirm");
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      return res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /set
 * Set page.
 */
exports.getSet = (req, res) => {
  if (!req.user) {
    return res.redirect('/');
  }
  res.render('account/set', {
    title: 'Set Password'
  });
};

/**
 * POST /set
 * Set usermane and password.
 */
exports.postSet = (req, res, next) => {
  console.log(req.body);
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.assert('confirm', 'Passwords do not match').equals(req.body.password);
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/set');
  }



  User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser) {
      existingUser.password = req.body.password;
      existingUser.save((err) => {
        if (err) { return next(err); }
      });
      req.flash({ msg: 'Password updated' });
      return res.redirect('/');
    }
  });

};

/**
 * GET /predict
 * Prediction page.
 */
exports.getPredict = (req, res) => {
  console.log("pred");
  if (!req.user) {
    return res.redirect('/');
  }  

  let users = [];
  console.log(req.user.ldap);
  let newPeopleToPredict  = new Promise(function(resolve, reject) {
    Relation.find({ldap1 : req.user.ldap}).sort({relation: -1}).limit(20).exec((err, relations)=>{
      if (err) { return next(err); }
      console.log(relations);
      let FoundAll = [];
      for(rel of relations){
        console.log(rel);
        FoundAll.push(new Promise(function(resolved, reject) {
          User.findOne({ldap: rel.ldap2}, (err, usr)=>{
            if (err) { return next(err); reject(err);}
            users.push(usr);
            resolved("Found one");
          });
        }));
      }
      Promise.all(FoundAll).then(() =>{resolve("Done");}).catch((e)=>{console.log(e)}); 
    });
  });

  newPeopleToPredict.then((result)=>{
    console.log("Users :");
    console.log(users);
    res.render('account/predict', {
      title: 'Predict',
      users : users
    });
  },(err)=>{
    console.log("not found any user");
    res.render('account/predict', {
      title: 'Predict',
      users : null
    });
  });
};

/**
 * POST /predict
 * Save predictions
 */
exports.postPredict = (req, res, next) => {
  req.assert('password', 'Password cannot be blank').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }
};


/**
 * GET /profile/:ldap
 * Profile page.
 */
exports.getProfile = (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  var user_q;
  var rel_q;
  var salary;
  var notifications;

  let getUserProfile  = new Promise(function(resolve, reject) {
    console.log(req.params.ldap);
    User.findOne({ldap: req.params.ldap}, (err, usr)=>{
      if (err) { return next(err); reject(err); }
      user_q = usr;
      console.log("Resolving host");
      resolve("Done");
    });
  });

  let getRelation  = new Promise(function(resolve, reject) {
    Relation.findOne({ldap1: req.params.ldap, ldap2:req.user.ldap}, (err, rel)=>{
      if (err) { return next(err); reject(err); }
      rel_q = rel.predicted;
      resolve("Done");
    });
  });

  let getSalary  = new Promise(function(resolve, reject) {
    Salary.findOne({ldap: req.params.ldap},{},{sort:{'createdAt': -1}}, (err, sal)=>{
      if (err) { return next(err); reject(err); }
      salary = sal.salary;
      resolve("Done");
    });
  }); 

  let getNotifications = new Promise(function(resolve, reject) {
    Notifications.find({ldap: req.params.ldap},{},{sort:{'createdAt': -1}}).limit(20).exec((err, noti)=>{
      if (err) { return next(err); reject(err); }
      notifications = noti;
      resolve("Done");
    });
  }); 

  Promise.all([getRelation, getUserProfile, getSalary, getNotifications]).then((result)=>{
    res.render('profile', {
      title: user_q.profile.first_name,
      user_q : user_q,
      predicted : rel_q,
      salary : salary
    });
  },(err)=>{
    res.render('home', {
      title: 'Home'
    });
  });
};

/**
 * POST /profile/:ladp
 * Save predictions
 */
exports.postProfile = (req, res, next) => {
  req.assert('salary', 'Salary cannot be blank').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  let savePrediction = new Promise(function(resolve, reject) {
    Prediction.create({ldap1: req.params.ldap, ldap2: req.user.ldap, salary: req.body.salary}, function(err){
      if (err) { console.log(err);return next(err); reject(err); }
      resolve("Done");
    });
  });

  let changeRelation  = new Promise(function(resolve, reject) {
    Relation.findOne({ldap1: req.params.ldap, ldap2:req.user.ldap}, (err, rel)=>{
      console.log("found relations");
      if (err) { console.log(err); return next(err); reject(err); }
      rel.predicted = true;
      rel.save((err)=>{resolve("Done");});
    });
  });

  Promise.all([changeRelation, savePrediction]).then((result)=>{
    req.flash('success', { msg: 'Predicted!' });
    return res.redirect(req.session.returnTo || '/');
  },(err)=>{
    res.render('home', {
      title: 'Home'
    });
  });


};


/**
 * GET /logout
 * Log out.
 */

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * GET /callback
 * 
 */

exports.gotCallback = (req, res, next) => {
  var code = req.query.code;
  const user = new User({ldap: "newRequest"});
  request({
        url: 'https://gymkhana.iitb.ac.in/sso/oauth/token/',
        method: 'POST',
        headers : {
            "Authorization" : "Basic "+ new Buffer(process.env.IITB_SSO_CLIENT_ID+":"+process.env.IITB_SSO_CLIENT_SECRET).toString('base64')
        },
        form: {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': 'http://10.8.100.123:8080/auth/iitbsso/callback'
        }
    }, function(err, resf) {

        var tokens = JSON.parse(resf.body);
        console.log("Token:", tokens);
        console.log(user);
        user.tokens.access_token = tokens.access_token;
        user.tokens.token_type = tokens.token_type;
        user.tokens.expires_in = tokens.expires_in;
        user.tokens.refresh_token = tokens.refresh_token;
        user.tokens.scope = tokens.scope;
        request({
              url: 'https://gymkhana.iitb.ac.in/sso/user/api/user/?fields=first_name,last_name,type,profile_picture,sex,username,email,program,contacts,insti_address,secondary_emails,mobile,roll_number',
              method: 'GET',
              headers : {
                  "Authorization" : "Bearer "+ tokens.access_token
              }
          }, function(err1, res1) {
              var info = JSON.parse(res1.body);
              console.log("User Info:", info);
              user.ldap = info.username;

              var promise = new Promise(function(resolve, reject) {
                User.findOne({ ldap : info.username }, (err, existingUser) => {
                  if (err) { return next(err); }
                  if (existingUser) {
                      existingUser.save((err) => {
                      if (err) { return next(err); }
                    });
                    req.logIn(existingUser, (err) => {
                      if (err) { return next(err); }         
                    });
                    resolve("Found");
                  }else {
                    reject("Not Found");
                  }
                });
              });
              /*
              User.findOne({ username : info.username }, (err, existingUser) => {
                if (err) { return next(err); }
                if (existingUser) {
                  console.log('I fonud one');
                  existingUser.save((err) => {
                    if (err) { return next(err); }
                  });
                  req.logIn(existingUser, (err) => {
                    if (err) { return next(err); }         
                    req.flash('success', { msg: 'Success! You are logged in.' });
                    return res.redirect(req.session.returnTo || '/');
                  });
                }
              });*/

              promise.then(function(result) {
                req.flash('success', { msg: 'Success! You are logged in.' });
                return res.redirect(req.session.returnTo || '/');
                console.log(result); // "Stuff worked!"
              }, function(err) {
                console.log('I fonud none');
                console.log(user);
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
                  user.profile.insti_address.id = info.insti_address.id;
                  user.profile.insti_address.room = info.insti_address.room;
                  user.profile.insti_address.hostel = info.insti_address.hostel;
                  user.profile.insti_address.hostel_name = info.insti_address.hostel_name;
                  user.profile.program.id = info.program.id;
                  user.profile.program.department = info.program.department;
                  user.profile.program.department_name = info.program.department_name;
                  user.profile.program.join_year = info.program.join_year;
                  user.profile.program.graduation_year = info.program.graduation_year;
                  user.profile.program.degree = info.program.degree;
                  user.profile.program.degree_name = info.program.degree_name;
                  user.profile.secondary_emails = info.secondary_emails;

                user.save((err) => {
                    console.log("saved s");
                    if (err) { console.log("saved");return next(err); }
                    User.find({}, (err, Users) => {  
                      console.log(Users);
                      if (err) { return next(err);}
                      for (u of Users){
                        let rel_coff = 0;
                        if(user.profile.deg_type == u.profile.deg_type) {
                          rel_coff = rel_coff + 10;
                          rel_coff = rel_coff + 6 - Math.abs(user.profile.program.join_year - u.profile.program.join_year);  
                        }
                        else rel_coff++;
                        if(user.profile.program.department == u.profile.program.department) rel_coff = rel_coff + 4;
                        if(user.profile.insti_address.hostel == u.profile.insti_address.hostel) rel_coff = rel_coff + 3;
                        if(user.profile.sex != u.profile.sex) rel_coff = rel_coff + 2;

                        Relation.create({ ldap1: user.ldap , ldap2: u.ldap, relation: rel_coff, predicted: false, friends: false  }, function (err, small) {
                          if (err) {return next(err);reject(err);}
                          console.log("Relation1 created");
                        });
                        Relation.create({ ldap1: u.ldap , ldap2: user.ldap, relation: rel_coff, predicted: false, friends: false  }, function (err, small) {
                          if (err) {return next(err);reject(err);}
                          console.log("Relation2 created");
                        });
                      }
                    });

                    Authenticity.create({ ldap: user.ldap , auth: 0.95}, function (err, small) {
                      if (err) {return next(err);}
                    });
                    
                    Salary.create({ ldap: user.ldap , salary: 100000, mean:100000, sigma:0, n:1}, function (err, small) {
                      if (err) {console.log(err); return next(err);}
                      console.log("User initialized");
                    });
                });
                req.logIn(user, (err) => {
                  if (err) { return next(err); }         
                  req.flash('success', { msg: 'Success! Registered.' });
                  return res.redirect('/set');
                });
                console.log(err); // Error: "It broke"
              });
              /*
              console.log('I fonud none');
              user.save((err) => {
                  if (err) { return next(err); }
              });
              req.logIn(user, (err) => {
                if (err) { return next(err); }         
                req.flash('success', { msg: 'Success! Registered.' });
                return res.redirect('/set');
              });*/
        });
  });
};