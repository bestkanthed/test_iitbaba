const passport = require('passport');
const User = require('../models/User');
const request = require('request');
const winston = require('winston');
const standard = require('../config/standard');
const fs = require('fs'); 

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
      return res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
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
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log(navbarItems);
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
      existingUser.known = req.body.known;
      existingUser.skills = req.body.skills;
      existingUser.hobbies = req.body.hobbies;
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
 * GET /picture
 * Set picture page.
 */
exports.getPicture = async (req, res, next) => {
  if (!req.user) {
    logger.info(req.ip + " opened /picture without login");
    return res.redirect('/');
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log(navbarItems);
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
  console.log("Posted");
  let base64Data = req.body.image_data.replace(/^data:image\/png;base64,/, "");
  filename = "./public/images/profile/"+req.user.ldap+".png";
  fs.writeFile(filename, base64Data, 'base64', function(err) {
    if(err) return next(err);
    
    User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
      if (err) return next(err);
      if (existingUser) {
        existingUser.profile.upload_picture = true;
        existingUser.save((err) => {
          if (err) return next(err);
          req.flash({ msg: 'Picture Saved' });
          return res.redirect('/avg');
        });
      }
    });
  });
};


/**
 * GET /avg
 * avg page.
 */
exports.getAverage = async (req, res, next) => {
  if (!req.user) {
    logger.info(req.ip + " opened /picture without login");
    return res.redirect('/');
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log(navbarItems);
  return res.render('account/avg', {
    title: 'IITbaba',
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
  let usersToShow = await service.getNewPeopleToPredict(req.user.ldap, standard.notifications).catch(err => { next(err); });;
  //console.log(usersToShow);
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log(navbarItems);
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
  let op = [];
  let ip = [];
  let opredictions = await Predictions.getPredictionsBy(req.user.mid).catch(err => { next(err); });;
  for(pred of opredictions){
    op.push({
      ldap: await User.getUserLdapByMID(pred.mid1),
      name: await User.getUserNameByMID(pred.mid1),
      perdiction: pred.prediction
    });
  }
  let ipredictions = await Predictions.getPredictionsFor(req.user.mid).catch(err => { next(err); });;
  for(pred of ipredictions){
    ip.push({
      ldap: await User.getUserLdapByMID(pred.mid2),
      name: await User.getUserNameByMID(pred.mid2),
      perdiction: pred.prediction
    });
  }
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log(navbarItems);
  res.render('account/prediction', {
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
    logger.info("IP " + req.ip + " /profile?" + req.params.ldap +"without login");
    return res.redirect('/login');
  }

  let requestSent = Request.getRequest(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let friends = Relation.areFriends(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let requestReceived = Request.getRequest(req.user.ldap, req.params.ldap).catch(err => { next(err); }); // can be only true
  let predicted = Relation.getPredicted(req.params.ldap, req.user.ldap);
  // Send ID of the request else send null
  let user =  await User.getUser(req.params.ldap).catch(err => { next(err); });
  //let alreadyPredicted = Relation.getPredicted(req.params.ldap, req.user.ldap).catch(err => { next(err); });
  let navbarItems = service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  let salary = Salary.getSalary(user.mid).catch(err => { next(err); });

  Promise.all([user, salary, navbarItems, requestSent, requestReceived, friends, predicted]).then(values => { 
      console.log("Logging first_name");
      console.log(values[0].profile.first_name);
      if(req.params.ldap==req.user.ldap) values[6] = true;
      console.log("Logging if request recieved from the profiled person");
      console.log(values[4]);
      
      console.log("Logging notifications");
      console.log(values[2].notifications);

      console.log("Logging salary");
      console.log(values[1].toFixed(2));
      

      res.render('profile', {
        title: values[0].profile.first_name,
        userp : values[0],
        predicted : values[6],
        friends: values[5],
        salary : values[1].toFixed(2),
        navbarItems : values[2],
        requestSent: values[3],
        requestReceived: values[4] == null ? null : values[4].id
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
  
  let updateRelation = await Relation.predicted(req.params.ldap, req.user.ldap);
  let createPrediction = await Prediction.createPrediction(req.body.mid, req.user.mid, req.body.salary).catch(err=>{ next(err); });
  let success = await service.updateDatabasePostPrediction(Number(req.body.mid), Number(req.user.mid), Number(req.body.salary)).catch(err => { next(err); });
  console.log(success);
  let notification = await Notification.createNotification(req.params.ldap, req.user.ldap, req.user.first_name+" predicted for you");
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
    console.log("Here");
    logger.info("IP " + req.ip + " /search without login");
    return res.redirect('/');
  }

// Move these down with promises as they are not required here
  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
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
    case 'send':
      let requ = await Request.getRequest(req.user.ldap, req.body.ldap);
      if(requ){
        await Relation.makeFriends(req.user.ldap, req.body.ldap);
        await Relation.makeFriends(req.body.ldap, req.user.ldap);
        await Notification.createNotification(req.body.ldap, req.user.ldap, "You are now friends with "+req.user.first_name);
        await Notification.createNotification(req.user.ldap, req.body.ldap, "You are now friends with "+req.body.ldap);// Make name here
        await Request.deleteRequest(req.user.ldap, req.body.ldap).catch(err=>{ next(err); });        
        return res.send("Also request from other side");
      }
      return res.send(await Request.createRequest(req.body.ldap, req.user.ldap, req.user.profile.username).catch(err=>{ next(err); }));
    case 'delete':
      await Request.deleteRequest(req.body.ldap, req.user.ldap).catch(err=>{ next(err); });
      return res.send("deleted");    
    case 'see': return res.send(await Request.seeRequests(req.user.ldap).catch(err=>{ next(err); }));        
    case 'click': return res.send(await Request.clickRequest(req.body.id).catch(err=>{ next(err); }));        
    case 'accept':
      await Relation.makeFriends(req.user.ldap, req.body.ldap);
      await Relation.makeFriends(req.body.ldap, req.user.ldap);
      await Notification.createNotification(req.body.ldap, req.user.ldap, "You are now friends with "+req.user.profile.username);
      await Notification.createNotification(req.user.ldap, req.body.ldap, "You are now friends with "+req.body.ldap);// Make name here
      await Request.deleteRequest(req.body.ldap, req.user.ldap).catch(err=>{ next(err); });
      return res.send("accepted");
    case 'reject': 
      await Request.deleteRequest(req.body.ldap, req.user.ldap).catch(err=>{ next(err); });
      return res.send("rejected");
    case 'unfriend':
      await Relation.unfriend(req.user.ldap, req.body.ldap);
      await Relation.unfriend(req.body.ldap, req.user.ldap);
      return res.send("unfriend");
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
    case 'see': return res.send(await Notification.seeNotifications(req.user.ldap).catch(err=>{ next(err); }));        
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
            'redirect_uri': 'http://10.8.100.130:8080/auth/iitbsso/callback'
        }
    }, function(err, resf) {

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
              headers : {
                  "Authorization" : "Bearer "+ tokens.access_token
              }
          }, async (err1, res1)=> {
              var info = JSON.parse(res1.body);
              //console.log("User Info:", info);
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
              /*
              await Salary.createSalary(user.ldap, 100000, 10000).catch(err=>{console.log(err);});
              await SalaryStat.updateSalaryStatNewEntry(100000).catch(err=>{console.log(err);});
              await Authenticity.createAuthenticity(user.ldap, 0).catch(err=>{console.log(err);}); // 0 is the k value // it means max auth
              */
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
                console.log("send sending set");
                return res.redirect('/set');
              });
            }
          });
    });
};