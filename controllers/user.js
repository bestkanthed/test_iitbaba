const passport = require('passport');
const User = require('../models/User');
const request = require('request');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Authenticity = require('../models/Authenticity');
const AuthenticityPoint = require('../models/AuthenticityPoint');
const Salary = require('../models/Salary');
const winston = require('winston');
const standard = require('../config/standard');

/// Mark the difference between res.render and return res.render


const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'error',
      filename: 'errors.log',
      level: 'error'
    }),
    new (winston.transports.File)({
      name: 'info',
      filename: 'info.log',
      level: 'info'
    })
  ]
});

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
    logger.info(req.body.username+" : Entered no password "+ errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    console.log(user);
    if (err) { 
      logger.error(err);
      return next(err); 
    }
    if (!user) {
      logger.info(req.body.username+" : username was entered but doesn't exist "+info);
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { 
        logger.error(err);
        return next(err); 
      }
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
    logger.info(req.ip + "opened /set");
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
    logger.info(req.user+" : password and set password don't match");
    req.flash('errors', errors);
    return res.redirect('/set');
  }

  User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
    if (err) { 
      return next(err); }
    if (existingUser) {
      existingUser.password = req.body.password;
      existingUser.save((err) => {
        if (err) { 
          logger.error(err);
          return next(err); 
        }
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
exports.getPredict = async (req, res, next) => {
  console.log("pred");
  if (!req.user) {
    logger.info("IP " + req.ip + " /predict without login");
    return res.redirect('/');
  }
  let [users, navbarItems] = await Promise.all([service.getNewPeopleToPredict(req.user.ldap, standard.notifications), service.getNavItems(req.user.ldap, standard.requests)]).catch(err => { next(err); });
  res.render('account/predict', {
    title: 'Predict',
    users : users,
    navbarItems : navbarItems
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
    logger.info("IP " + req.ip + " /profile?" + req.params.ldap +"without login");
    return res.redirect('/login');
  }

  let user = User.getUser(req.params.ldap).catch(err => { next(err); });
  let alreadyPredicted = Relation.getPredicted(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let navbarItems = service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  
  alreadyPredicted.then(bool=>{
    if(bool) {
      let salary = Salary.getSalary(ldap).catch(err => { next(err); });
      Promise.all([user, salary, navbarItems]).then(values => { 
        res.render('profile', {
          title: values[0].profile.first_name,
          user : values[0],
          predicted : bool,
          salary : salary,
          navbarItems : values[1]
        });
      }).catch(err=>{ next(err); });
    } else {
      Promise.all([user, navbarItems]).then(values => { 
        res.render('profile', {
          title: values[0].profile.first_name,
          user : values[0],
          predicted : bool,
          navbarItems :values[1]
        });
      }).catch(err=>{ next(err); });
    }
  });
};

/**
 * POST /profile/:ladp
 * Save predictions
 */
exports.postProfile = async (req, res, next) => {
  req.assert('salary', 'Prediction cannot be blank').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/' || req.session.returnTo);
  }

  if (!req.user) {
    logger.info("IP " + req.ip + " /profile?" + req.params.ldap +"without login");
    return res.redirect('/login');
  }

  let savePrediction = await Prediction.createPrediction(req.params.ldap, req.user.ldap, req.body.salary).catch(err=>{ next(err); });
  let changeRelation = await Relation.predicted(req.params.ldap, req.user.ldap).catch(err=>{ next(err); });
  
  req.flash('success', { msg: 'Predicted!' });
  res.redirect('/' || req.session.returnTo);

  // create auth 1,2 point
  let salaryMean = Salary.getMean(req.params.ldap);
  let salaryStd = Salary.getStd(req.params.ldap);
  // Can promisify this too
  let kPoint = Math.abs((await salaryMean) - req.body.salary) / (await salaryStd);
  let authPoint = 1 - erf( Math.abs( (await salaryMean) - req.body.salary) / (await salaryStd) );
  let createNewAuthPoint = kPoint.createKPoint(req.params.ldap, req.user.ldap, kPoint);
  
  // update avg auth of person
  let updateAuthenticity = Authenticity.updateAuthenticity(req.user.ldap, kPoint);
  
  // change salary
  let createSalary = 

  // change the remaing auths because of the change in auth

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