const passport = require('passport');
const User = require('../models/User');
const request = require('request');
const winston = require('winston');
const standard = require('../config/standard');
const fs = require('fs');
const im = require('imagickal');
const ssl = require('ssl-root-cas/latest').inject();

const Request = require('../models/Request');
const KPoint = require('../models/KPoint');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Authenticity = require('../models/Authenticity');
const Salary = require('../models/Salary');
const Mean = require('../models/Mean');
const Matrix = require('../models/Matrix');
const SalaryStat = require('../models/SalaryStat');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
//Just
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

/**
 * GET /
 * home page.
 */

exports.home = async (req, res, next) =>{
    console.log("Home");
    let graph = await service.getGraph();
    
    if (req.user) {

      let completeLevel = await User.getComplete(req.user.ldap);
      if(!completeLevel) return res.redirect('/set');
      if(completeLevel==1) return res.redirect('/picture');
      if(completeLevel==2) return res.redirect('/avg');
      
      let navbarItems = await service.getNavItems(req.user.ldap, standard.requests)
      return res.render('home', {
        title: 'Home',
        navbarItems : navbarItems,
        graph: graph
      });
    }
    console.log("Now will render home");
    return res.render('home', { 
      title : 'Home',
      graph: graph
    });
};


/**
 * get /circle
 * circle
 */

exports.getCircle = async (req, res, next) =>{

    if (!req.user) {
      logger.info(req.ip + " opened /circle without login");
      return res.redirect('/login');
    }

    let completeLevel = await User.getComplete(req.user.ldap);
    if(!completeLevel) return res.redirect('/');
    if(completeLevel<3) return res.redirect('/');

    let graph = await service.getGraphFor(req.user.ldap);
    let navbarItems = await service.getNavItems(req.user.ldap, standard.requests)
    return res.render('circle', {
      title: 'Circle',
      navbarItems : navbarItems,
      graph: graph
    });
};


/**
 * POST /circle
 * circle
 */

exports.postCircle = async (req, res, next) =>{
   if (!req.user) {
      logger.info(req.ip + " opened /circle without login");
      return res.redirect('/login');
    }
    let circle = await service.getFirstCircleGraph(req.body.ldap);

    let navbarItems = await service.getNavItems(req.user.ldap, standard.requests)
    return res.render('circle', {
      title: 'Circle',
      navbarItems : navbarItems,
      circle: circle
    });
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
    //console.log(user);
    if (err) {return next(err);}
    if (!user) {
      logger.info(req.body.username+" : username was entered but doesn't exist "+info);
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      return res.redirect('/');
    });
  })(req, res, next);
};

/**
 * GET /about
 * About page.
 */
exports.getAbout = async (req, res, next) =>{
    console.log("About");    
    if (req.user) {
      let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
      return res.render('about', {
        title: 'About',
        navbarItems : navbarItems,
      });
    }
    console.log("Now will render about");
    return res.render('about', { 
      title : 'About',
    });
};

/**
 * GET /set
 * Set page.
 */
exports.getSet = async (req, res, next) => {
  if (!req.user) {
    logger.info(req.ip + " opened /set without login");
    return res.redirect('/');
  }
  if(await User.getComplete(req.user.ldap) == 1){
    req.flash('errors', 'Initial form completion is already over');
    return res.redirect('/');
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests)
  return res.render('account/set', {
    title: 'Set Password',
    navbarItems: navbarItems
  });
};

/**
 * POST /set
 * Set usermane and password.
 */
exports.postSet = (req, res, next) => {
  //console.log(req.body);
  if (!req.user) {
    logger.info(req.ip + " posted /set without login");
    return res.redirect('/');
  }

  if(await User.getComplete(req.user.ldap) == 2){
    req.flash('errors', 'Initial form completion is already over');
    return res.redirect('/');
  }
  
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
      existingUser.first_name = req.body.first.toUpperCase();
      existingUser.last_name = req.body.last.toUpperCase();
      // existingUser.known = req.body.known.toUpperCase();
      // existingUser.skills = req.body.skills.toUpperCase();
      // existingUser.hobbies = req.body.hobbies.toUpperCase();
      existingUser.complete = 1;
      existingUser.save((err) => {
        if (err) { 
          logger.error(err);
          return next(err); 
        }
      });
      req.flash({ msg: 'Profile updated' });
      return res.redirect('/picture');
    }
  });
};

/**
 * GET /edit
 * Get edit page.
 */
exports.getEdit = async (req, res, next) => {
  if (!req.user) {
    logger.info(req.ip + " opened /edit without login");
    return res.redirect('/');
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  return res.render('account/edit', {
    title: 'Edit',
    navbarItems: navbarItems,
  });
};

/**
 * POST /edit
 * Edit details.
 */
exports.postEdit = (req, res, next) => {
  //console.log(req.body);
  if (!req.user) {
    logger.info(req.ip + " posted /edit without login");
    return res.redirect('/');
  }
  
  User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser) {
      existingUser.first_name = req.body.first.toUpperCase();
      existingUser.last_name = req.body.last.toUpperCase();
      existingUser.hostel = req.body.hostel.toUpperCase();
      existingUser.room = req.body.room.toUpperCase();
      existingUser.from = req.body.from.toUpperCase();
      existingUser.dob = req.body.dob.toUpperCase();
      existingUser.contact = req.body.contact.toUpperCase();
      existingUser.email = req.body.email.toLowerCase();
      existingUser.known = req.body.known;
      existingUser.hobbies = req.body.hobbies;
      existingUser.skills = req.body.skills;
      existingUser.looking = req.body.looking;
      existingUser.google = req.body.google;
      existingUser.facebook = req.body.facebook;
      existingUser.twitter = req.body.twitter;
      existingUser.linkedin = req.body.linkedin;
      existingUser.instagram = req.body.instagram;
      existingUser.snapchat = req.body.snapchat;
      
      existingUser.save((err) => {
        if (err) { 
          logger.error(err);
          return next(err); 
        }
        req.flash({ msg: 'Profile updated' });
        return res.redirect('/edit');
      });
    }
  });
};

/**
 * GET /picture
 * Set picture page.
 */
exports.getPicture = async (req, res, next) => {
  
  if (!req.user) {
    logger.info(req.ip + " opened /picture without login");
    return res.redirect('/');
  }
  if(await User.getComplete(req.user.ldap) == 2){
    req.flash('errors', 'Initial form completion is already over');
    return res.redirect('/');
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  return res.render('account/picture', {
    title: 'Upload Profile Picture',
    navbarItems: navbarItems
  });
};

// Add perdict for IITbaba

/**
 * POST /picture
 * posted picture .
 */
exports.postPicture = async (req, res, next)=>{
  console.log("Posted picture");
  if(await User.getComplete(req.user.ldap) == 2){
    req.flash('errors', 'Initial form completion is already over');
    return res.redirect('/');
  }
  let base64Data = req.body.image_data.replace(/^data:image\/png;base64,/, "");
  filename = "./public/images/profile/"+req.user.ldap+".png";
  fs.writeFile(filename, base64Data, 'base64', function(err) {
    if(err) return next(err);
    im.identify("./public/images/profile/"+req.user.ldap+".png", true).then(function (data) {
	    console.log("Logging picture data", data);
      User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
        if (err) return next(err);
        if (existingUser) {
          existingUser.profile.upload_picture = true;
          existingUser.complete = 2;
          existingUser.save((err) => {
            if (err) return next(err);
            req.flash({ msg: 'Picture Saved' });
            return res.redirect('/avg');
          });
        }
      });
    }).catch(err1=>{
      console.log("logging err",err1);
      return res.redirect('/picture');
    });
  });
};


/**
 * GET /avg
 * avg page.
 */
exports.getAverage = async (req, res, next) => {
  if (!req.user) {
    logger.info(req.ip + " opened /avg without login");
    return res.redirect('/');
  }
  if(await User.getComplete(req.user.ldap) == 3){
    req.flash('errors', 'Initial form completion is already over');
    return res.redirect('/');
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  return res.render('account/avg', {
    title: 'Your Estimate',
    navbarItems: navbarItems
  });
};

/**
 * POST /avg
 * posted avg.
 */
exports.postAverage = async (req, res, next)=>{
  console.log("Posted");
  let userPredictionForBaba = Number(req.body.babaSalary);
  if (!req.user) {
    logger.info(req.ip + " posted /avg without login");
    return res.redirect('/');
  }

  if(await User.getComplete(req.user.ldap)==3){
    req.flash('errors', 'You already predicted for yourself');
    return res.redirect('/');
  }

  if(userPredictionForBaba<2 || userPredictionForBaba>50){
    req.flash('errors', 'Not a good estimate');
    return res.redirect('/avg');
  }
  //let babaPredictionForUser = await Mean.getMean();
  //babaPredictionForUser = Number(babaPredictionForUser?babaPredictionForUser:userPredictionForBaba);
  let mean = await Mean.getMean(); 
  let newMean = {
    total : mean.total + userPredictionForBaba,
    n: mean.n + 1
  }
  let createMean = Mean.newMean(newMean);
  let salaries = await Matrix.addNewUserToMatrix(newMean.total/newMean.n, userPredictionForBaba);
  let setMid = await User.setMID(req.user.ldap, salaries.length - 1);
  let updateSalaries = await Salary.updateSalaries(salaries);
  await User.setComplete(req.user.ldap, 3);
  req.flash({ msg: 'Saved' });
  return res.redirect('/');
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

  let completeLevel = await User.getComplete(req.user.ldap);
  if(!completeLevel) return res.redirect('/');
  if(completeLevel<3) return res.redirect('/');
  
  let usersToShow = await service.getNewPeopleToPredict(req.user.ldap, standard.notifications);
  //console.log(usersToShow);
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  res.render('account/predict', {
    title: 'Predict',
    users : usersToShow,
    navbarItems : navbarItems
  });
};

/**
 * GET /predictons
 * Previous Prediction page.
 */
exports.getPredictions = async (req, res, next) => {
  console.log("previous predtions");
  if (!req.user) {
    logger.info("IP " + req.ip + " /predict without login");
    return res.redirect('/');
  }

  let completeLevel = await User.getComplete(req.user.ldap);
  if(!completeLevel) return res.redirect('/');
  if(completeLevel<3) return res.redirect('/');
  
  let op = [];
  let ip = [];
  let opredictions = await Prediction.getPredictionsBy(req.user.mid);
  for(pred of opredictions){
    op.push({
      ldap: await User.getUserLdapByMID(pred.mid1),
      name: await User.getUserNameByMID(pred.mid1),
      prediction: pred.prediction
    });
  }
  let ipredictions = await Prediction.getPredictionsFor(req.user.mid);
  for(pred of ipredictions){
    ip.push({
      ldap: await User.getUserLdapByMID(pred.mid2),
      name: await User.getUserNameByMID(pred.mid2),
      prediction: pred.prediction
    });
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  console.log('ip');console.log(ip);console.log("op");console.log(op);
  res.render('account/predictions', {
    title: 'Previous Predictions',
    op : op,
    ip: ip,
    navbarItems : navbarItems
  });
};

/**
 * GET /profile/:ldap
 * Profile page.
 */
exports.getProfile = async (req, res, next) => {
  // here if the req.user.ldap is same as the 
  
  if (!req.user) {
    logger.info("IP " + req.ip + " /profile?" + req.params.ldap +" without login");
    return res.redirect('/login');
  }
  if(req.params.ldap=='iitbaba'){
    return res.redirect('/about');
  }

  let completeLevel = await User.getComplete(req.user.ldap);
  if(!completeLevel) return res.redirect('/');
  if(completeLevel<3) return res.redirect('/');

  let requestSent = await Request.getRequest(req.params.ldap, req.user.ldap);
  let relationship = await Relation.getRelationship(req.params.ldap, req.user.ldap);
  let requestReceived = await Request.getRequest(req.user.ldap, req.params.ldap); // can be only true
  let predicted = await Relation.getPredicted(req.params.ldap, req.user.ldap);
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  
  // Send ID of the request else send null
  let user =  await User.getUser(req.params.ldap);
  if(!user) return res.render('nullprofile', {
      title: 'Not Registered',
      navbarItems : navbarItems,
  });
  //let alreadyPredicted = Relation.getPredicted(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  if(user) salary = await Salary.getSalary(user.mid);

  Promise.all([user, salary, navbarItems, requestSent, requestReceived, relationship, predicted]).then(values => {
      if(req.params.ldap==req.user.ldap) values[6] = true;
      let rels = "";
      
      for(rel of values[5]){
        rels = rels + " "+rel;
      }
      res.render('profile', {
        title: values[0].profile.first_name,
        userp : values[0],
        predicted : values[6],
        relationship: rels,
        salary : values[1].toFixed(2),
        navbarItems : values[2],
        requestSent: values[3],
        requestReceived: values[4] == null ? null : values[4].id
      });
    });
};

/**
 * POST /profile/:ladp
 * Save predictions
 */
exports.postProfile = async (req, res, next) => {
  req.assert('salary', 'Prediction cannot be blank').notEmpty();
  const errors = req.validationErrors();

  if (!req.user) {
    logger.info("IP " + req.ip + " /profile/" + req.params.ldap +" without login");
    return res.redirect('/login');
  }

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/profile/'+ req.params.ldap);
  }
  
  console.log(req.body);
  
  if(Number(req.body.salary)<3.5 || Number(req.body.salary)>100){
    req.flash('errors', 'Inapporpriate estimation');
    return res.redirect('/profile/'+ req.params.ldap);
  }
  
  if(req.body.repredict){
    let updatePrediction = await Prediction.updatePrediction(req.body.mid, req.user.mid, req.body.salary);
    let salary = await service.updateDatabasePostRePrediction(Number(req.body.mid), Number(req.user.mid), Number(req.body.salary));    
    console.log('Inside repredict');

    let notification = await Notification.createNotificationWithSalary(req.params.ldap, req.user.ldap, req.user.first_name+" re-predicted for you", salary);

    req.flash('success', { msg: 'Predicted!' });
    return res.redirect('/profile/'+req.params.ldap);
  
  }else{
    let updateRelation = await Relation.predicted(req.params.ldap, req.user.ldap);
    let createPrediction = await Prediction.createPrediction(req.body.mid, req.user.mid, req.body.salary);
    let salary = await service.updateDatabasePostPrediction(Number(req.body.mid), Number(req.user.mid), Number(req.body.salary));
    // returns the new salary that can be then shown 
    let notification = await Notification.createNotificationWithSalary(req.params.ldap, req.user.ldap, req.user.first_name+" predicted for you", salary);
    console.log('not Inside repredict');    
    req.flash('success', { msg: 'Predicted!' });
    if(req.body.popup) return res.send("predicted");
    return res.redirect('/profile/'+req.params.ldap);
  }
};

/**
 * GET /search
 * Prediction page.
 */
exports.getSearch = async (req, res, next) => {
  
  console.log("search");
  
  if (!req.user) {
    console.log("In no one");
    logger.info("IP " + req.ip + " /search without login");
    return res.redirect('/');
  }

  let completeLevel = await User.getComplete(req.user.ldap);
  if(!completeLevel) return res.redirect('/');
  if(completeLevel<3) return res.redirect('/');
// Move these down with promises as they are not required here
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests);
  console.log("Logging query");
  console.log(req.query);
 
  // if search from box
  if(req.query.box){
    console.log("in query box");
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
    results = await service.getSearchResults(req.query);
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
  if(req.body.relationship){
    if( typeof req.body.relationship === 'string' ) {
        req.body.relationship = [ req.body.relationship ];
    }
    await Relation.setRelationship(req.body.ldap, req.user.ldap, req.body.relationship);
    let relationship = "";
    for(rel of req.body.relationship){
      relationship = relationship + " "+rel;
    }
    await Notification.createNotification(req.body.ldap, req.user.ldap, toTitleCase(req.user.first_name.toLowerCase())+" related to you as"+relationship);
    return res.send(relationship);
  }
  else {
    await Relation.setRelationship(req.body.ldap, req.user.ldap, null);    
    return res.send(null);
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
    case 'create': return res.send(await Notification.createNotification(req.body.ldap1, req.body.ldap2, req.body.notification));
    case 'see': return res.send(await Notification.seeNotifications(req.user.ldap));        
    case 'click': return res.send(await Notification.clickNotification(req.body.id));
  }
};

/**
 * POST /subscription
 * register subscription for push notifications
 */

exports.postSubscription = async (req, res, next) => {
  if (!req.user) {
    return res.send("No user to subscribe");
  }
  let subscription = JSON.parse(req.body.subscription);
  console.log("Logging system endpoint", subscription.endpoint);
  if(subscription.endpoint)
  return res.send(await Subscription.updateSubscription(req.user.ldap, subscription));
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
        rejectUnauthorized: false,
        headers : {
            "Authorization" : "Basic "+ new Buffer(process.env.IITB_SSO_CLIENT_ID+":"+process.env.IITB_SSO_CLIENT_SECRET).toString('base64')
        },
        form: {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': 'https://iitbaba.com/auth/iitbsso/callback'
        }
    }, function(err, resf) {

        if(err) console.log(err);
        var tokens = JSON.parse(resf.body);
        //console.log("Token:", tokens);
        //console.log(user);
        user.tokens.access_token = tokens.access_token;
        user.tokens.token_type = tokens.token_type;
        user.tokens.expires_in = tokens.expires_in;
        user.tokens.refresh_token = tokens.refresh_token;
        user.tokens.scope = tokens.scope;
        request({
              url: 'https://gymkhana.iitb.ac.in/sso/user/api/user/?fields=first_name,last_name,type,profile_picture,sex,username,email,program,contacts,insti_address,secondary_emails,mobile,roll_number',
              method: 'GET',
              rejectUnauthorized: false,
              headers : {
                  "Authorization" : "Bearer "+ tokens.access_token
              }
          }, async (err1, res1)=> {
              var info = JSON.parse(res1.body);
              // console.log("User Info:", info);
              if(!info.username){console.log("Throwing back to auth/sso"); return res.redirect('/auth/iitbsso');} 
              user.ldap = info.username;
              //
            let exestingUser = await User.ifExists(info.username);
            if(exestingUser){
              let userLogin = await User.getUser(info.username);
              req.logIn(userLogin, (err) => {
                if (err) { return next(err); }
                req.flash('success', { msg: 'Successful Login!' });
                return res.redirect('/');
              });
            } else {
              console.log("Inside else");
              
              await User.initializeUser(user, info);
              let allUsers = await User.getAllLdaps();
              //console.log(allUsers);
              for(one of allUsers){
                console.log("Logging user ldap", one.ldap);
                await Relation.createRelation(user.ldap, one.ldap);
                await Relation.createRelation(one.ldap, user.ldap);
              }
              await Notification.createNotification(user.ldap, user.ldap, "Welcome to IITbaba");
              req.logIn(user, (err) => {
                if (err) { return next(err); }         
                req.flash('success', { msg: 'Success! Registered.' });
                console.log("send sending set");
                return res.redirect('/set');
              });
            }
          });
    });
};
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};