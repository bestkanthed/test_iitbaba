const passport = require('passport');
const User = require('../models/User');
const request = require('request');
const winston = require('winston');
const standard = require('../config/standard');

const Request = require('../models/Request');
const KPoint = require('../models/KPoint');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Authenticity = require('../models/Authenticity');
const Salary = require('../models/Salary');
const SalaryStat = require('../models/SalaryStat');
const Notification = require('../models/Notification');

const service = require('../services/service');
const _ = require('lodash');

/// Mark the difference between res.render and return res.render
/// Function format : <operation><returnParam><ReltionWithTheFunctionInput>
/// Example         : getLdapsOf();
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

exports.home = async (req, res, next) =>{
    if (req.user) {
      let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
      return res.render('home', {
        title: 'Home',
        navbarItems : navbarItems
      });
    }
    res.render('home', { title : 'Home' });
};

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
    if (err) {return next(err);}
    if (!user) {
      logger.info(req.body.username+" : username was entered but doesn't exist "+info);
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
    logger.info(req.ip + " opened /set without login");
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
  req.assert('first', 'First name cannot be blank').notEmpty();  
  req.assert('last', 'Last name cannot be blank').notEmpty();  
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
      existingUser.first_name = req.body.first;
      existingUser.last_name = req.body.last;
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
  let usersToShow = await service.getNewPeopleToPredict(req.user.ldap, standard.notifications).catch(err => { next(err); });;
  console.log(usersToShow);
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log(navbarItems);
  res.render('account/predict', {
    title: 'Predict',
    users : usersToShow,
    navbarItems : navbarItems
  });
};

/**
 * GET /profile/:ldap
 * Profile page.
 */
exports.getProfile = (req, res, next) => {
  // here if the req.user.ldap is same as the 
  
  if (!req.user) {
    logger.info("IP " + req.ip + " /profile?" + req.params.ldap +"without login");
    return res.redirect('/login');
  }

  let friends = Relation.areFriends(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let requestSent = Request.getRequest(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let user = User.getUser(req.params.ldap).catch(err => { next(err); });
  let alreadyPredicted = Relation.getPredicted(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let navbarItems = service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  let salary = Salary.getSalary(req.params.ldap).catch(err => { next(err); });


  Promise.all([user, salary, navbarItems, friends, requestSent, alreadyPredicted]).then(values => { 
      console.log("Logging first_name");
      console.log(values[0].profile.first_name);
      console.log(values[5]);

      res.render('profile', {
        title: values[0].profile.first_name,
        userp : values[0],
        predicted : values[5],
        friends: values[3],
        salaryCheck : values[1],
        navbarItems : values[2],
        requestSent: values[4]
      });
    }).catch(err=>{ next(err); });
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

  let createPrediction = await Prediction.createPrediction(req.params.ldap, req.user.ldap, req.body.salary).catch(err=>{ next(err); });  

  let success = await service.UpdateDatabasePostPrediction(req.params.ldap, req.user.ldap, req.body.salary).catch(err => { next(err); });

  req.flash('success', { msg: 'Predicted!' });
  res.redirect('/' || req.session.returnTo);
};

/**
 * GET /search
 * Prediction page.
 */
exports.getSearch = async (req, res, next) => {
  
  console.log("search");
  
  if (!req.user) {
    logger.info("IP " + req.ip + " /search without login");
    return res.redirect('/');
  }

// Move these down with promises as they are not required here
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log("Logging query");
  console.log(req.query);
 
  // if search from box
  if(req.query.box){
    // If empty search same as /predict
    if(_.isEmpty(req.query.box)) return res.render('/predict');
    let finalResults = await service.getBoxSearchResults(req.query.box);
    finalResults = _.uniq(finalResults);

    return res.render('results', {
      title: 'Results',
      navbarItems : navbarItems,
      users : finalResults
    });
  }
  
  if(req.query.page){
    res.render('search', {
      title: 'Search',
      navbarItems : navbarItems
    });
  } else{
    results = await service.getSearchResults(req.query).catch(err => { next(err); });
    res.render('results', {
      title: 'Results',
      navbarItems : navbarItems,
      users : results
    });
  } 
};

/**
 * POST /request
 * action on request
 */

exports.postRequest = async (req, res, next) => {
  if (!req.user) {
    logger.info("IP " + req.ip + " /request " + req.body.action +" without login");
    return res.redirect('/login');
  }

  console.log(req.body);

  switch(req.body.action){
    case 'create': return res.send(await Request.createRequest(req.body.ldap1, req.body.ldap2, req.body.name).catch(err=>{ next(err); }));
    case 'delete': return res.send(await Request.deleteRequest(req.body.ldap1, req.body.ldap2).catch(err=>{ next(err); }));    
    case 'see': return res.send(await Request.seeRequests(req.body.ldap).catch(err=>{ next(err); }));        
    case 'accept': return res.send(await Request.acceptRequest(req.body.id).catch(err=>{ next(err); }));    
    case 'reject': return res.send(await Request.rejectRequest(req.body.id).catch(err=>{ next(err); }));        
  }
};


/**
 * POST /notification
 * action on notification
 */

exports.postNotification = async (req, res, next) => {
  if (!req.user) {
    logger.info("IP " + req.ip + " /notification " + req.body.action +" without login");
    return res.redirect('/login');
  }

  console.log(req.body);

  switch(req.body.action){
    case 'create': return res.send(await Notification.createNotification(req.body.ldap1, req.body.ldap2, req.body.notification).catch(err=>{ next(err); }));
    case 'see': return res.send(await Notification.seeNotifications(req.body.ldap).catch(err=>{ next(err); }));        
    case 'click': return res.send(await Notification.clickNotification(req.body.id).catch(err=>{ next(err); }));
  }
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

exports.gotCallback = async (req, res, next) => {
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
            'redirect_uri': 'http://localhost:8080/auth/iitbsso/callback'
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
          }, async (err1, res1)=> {
              var info = JSON.parse(res1.body);
              console.log("User Info:", info);
              user.ldap = info.username;

              //
            let exestingUser = await User.ifExists(info.username).catch(err=>{console.log(err);});
            if(exestingUser){
              let userLogin = await User.getUser(info.username).catch(err=>{console.log(err);});
              req.logIn(userLogin, (err) => {
                if (err) { return next(err); }
                req.flash('success', { msg: 'Successful Login!' });
                return res.redirect('/');         
              });
            } else {
              console.log("Inside else");
              await User.initializeUser(user, info).catch(err=>{console.log(err);});
              await Salary.createSalary(user.ldap, 100000, 10000).catch(err=>{console.log(err);});
              await SalaryStat.updateSalaryStatNewEntry(100000).catch(err=>{console.log(err);});
              await Authenticity.createAuthenticity(user.ldap, 0).catch(err=>{console.log(err);}); // 0 is the k value // it means max auth
              let allUsers = await User.getAllLdaps().catch(err=>{console.log(err);});
              //console.log(allUsers);
              for(one of allUsers){
                console.log(one.ldap);
                await Relation.createRelation(user.ldap, one.ldap);
                await Relation.createRelation(one.ldap, user.ldap);
              }
              await Notification.createNotification(user.ldap, user.ldap, "Welcome to IITbaba").catch(err=>{console.log(err);});
              req.logIn(user, (err) => {
                if (err) { return next(err); }         
                req.flash('success', { msg: 'Success! Registered.' });
                return res.redirect('/set');
              });
            }
          });
    });
};