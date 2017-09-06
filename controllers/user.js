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

  let navbarItems = await service.getNavItems(req.user.ldap, standard.requests).catch(err => { next(err); });
  console.log("Logging query");
  console.log(req.query);
  if(req.query.box){
    // built query
    let bq = {};
    queries = req.query.box.split(" "); 
    for(q of queries){
      let c = q.toUpperCase();  
      if(c == "B.TECH." || c == "B.TECH" || c == "BTECH" || c == "BACHELOR" || c == "BACHELORS" || c == "UG" || c == "UNDERGRADUATE" || c =="UNDERGRAD" || c == "UNDER"){ 
        if(bq.degree) bq.degree.push("BTECH"); else {bq.degree=[]; bq.degree.push("BTECH");}
      }
      if(c == "M.TECH." || c == "M.TECH" || c == "MTECH" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MTECH"); else {bq.degree=[]; bq.degree.push("MTECH");}
      }
      if(c == "PH.D." || c == "PH.D" || c == "PHD" || c == "DOCTRATE" || c == "DOC"){ 
        if(bq.degree) bq.degree.push("PHD"); else {bq.degree=[]; bq.degree.push("PHD");}
      }
      if(c=="MBA" || c=="BUSSINESS" || c=="ADMINISTRATION" || c=="MASTER" || c =="MANAGEMENT" || c=="PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("EMBA"); else {bq.degree=[]; bq.degree.push("EMBA");}
      }
      if(c == "M.SC." || c == "M.SC" || c == "MSC" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MSC"); else {bq.degree=[]; bq.degree.push("MSC");}
      }
      if(c=="DD" || c=="DUAL" || c=="INTEGRATED"){ 
        if(bq.degree) bq.degree.push("DD"); else {bq.degree=[]; bq.degree.push("DD");}
      }
      if(c == "B.DES." || c == "B.DES" || c == "BDES" || c == "BACHELOR" || c == "BACHELORS" || c == "UG" || c == "UNDERGRADUATE" || c =="UNDERGRAD" || c == "UNDER"){ 
        if(bq.degree) bq.degree.push("BDES"); else {bq.degree=[]; bq.degree.push("BDES");}
      }
      if(c == "M.DES." || c == "M.DES" || c == "MDES" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MDES"); else {bq.degree=[]; bq.degree.push("MDES");}
      }
      if(c == "M.PHIL." || c == "M.PHIL" || c == "MPHIL" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MPHIL"); else {bq.degree=[]; bq.degree.push("MPHIL");}
      }
      if(c == "M.MG." || c == "M.MG" || c == "MMG" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST" || c =="MANAGEMENT"){ 
        if(bq.degree) bq.degree.push("MMG"); else {bq.degree=[]; bq.degree.push("MMG");}
      }
      if(c=="17" || c=="2017" || c=="1ST" || c=="FIRST" || c=="FRESHI" || c=="FRESHIE" || c=="FRESHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2017"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2017");}
      }
      if(c=="16" || c=="2016" || c=="2ND" || c=="SECOND" || c=="SOPHI" || c=="SOPHIE" || c=="SOPHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2016"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2016");}
      }
      if(c=="15" || c=="2015" || c=="3RD" || c=="THIRD" || c=="THIRDI" || c=="THIRDIE" || c=="THIRDIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2015"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2015");}
      }
      if(c=="14" || c=="2014" || c=="4TH" || c=="FOURTH" || c=="FOURTHI" || c=="FOURTHIE" || c=="FOURTHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2014"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2014");}
      }
      if(c=="13" || c=="2013" || c=="5TH" || c=="FIFTH" || c=="FIFTHI" || c=="FIFTHIE" || c=="FIFTHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2013"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2013");}
      }
      if(c=="12" || c=="2012" || c=="PASS" || c=="OUT" || c=="ALUM" || c=="ALUMNUS" || c=="ALUMNI"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2012"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2012");}
      }
      if(c=="AE" || c=="AERO" || c=="AEROSPACE"){ 
        if(bq.department) bq.department.push("AE"); else {bq.department=[]; bq.department.push("AE");}
      }
      if(c=="BB" || c=="BIO" || c=="BIOSCIENCE" || c=="BIOSCIENCES" || c=="BOIENGINEERING"){ 
        if(bq.department) bq.department.push("BB"); else {bq.department=[]; bq.department.push("BB");}
      }
      if(c=="CL" || c=="CHE" || c=="CHEMICAL"){ 
        if(bq.department) bq.department.push("CHE"); else {bq.department=[]; bq.department.push("CHE");}
      }
      if(c=="CH" || c=="CHEM" || c=="CHEMISTRY"){ 
        if(bq.department) bq.department.push("CH"); else {bq.department=[]; bq.department.push("CH");}
      }
      if(c=="CLE" ||c=="CE" || c=="CIVIL"){ 
        if(bq.department) bq.department.push("CLE"); else {bq.department=[]; bq.department.push("CLE");}
      }
      if(c=="CSE" || c=="CS" || c=="COMPUTER" || c=="COMP"){ 
        if(bq.department) bq.department.push("CSE"); else {bq.department=[]; bq.department.push("CSE");}
      }
      if(c=="EE" || c=="ELECTRICAL" || c=="ELEC"){ 
        if(bq.department) bq.department.push("EE"); else {bq.department=[]; bq.department.push("EE");}
      }
      if(c=="EE" || c=="ELECTRICAL" || c=="ELEC"){ 
        if(bq.department) bq.department.push("EE"); else {bq.department=[]; bq.department.push("EE");}
      }
      if(c=="ESE" || c=="ENERGY" || c=="EN"){ 
        if(bq.department) bq.department.push("ESE"); else {bq.department=[]; bq.department.push("ESE");}
      }
      if(c=="HSS" || c=="HUMANITY" || c=="HUMANITIES" || c=="SOCIAL" || c=="HS"){ 
        if(bq.department) bq.department.push("HSS"); else {bq.department=[]; bq.department.push("HSS");}
      }
      if(c=="IDC" || c=="INDUSTRIAL" || c=="DESIGN"){ 
        if(bq.department) bq.department.push("IDC"); else {bq.department=[]; bq.department.push("IDC");}
      }
      if(c=="MATH" || c=="MATHS" || c=="MATHEMATICS" || c=="MA" || c=="MM"){ 
        if(bq.department) bq.department.push("MM"); else {bq.department=[]; bq.department.push("MM");}
      }
      if(c=="MECH" || c=="ME" || c=="MECHANICAL"){ 
        if(bq.department) bq.department.push("ME"); else {bq.department=[]; bq.department.push("ME");}
      }
      if(c=="META" || c=="MEMS" || c=="METALLURGY" || c=="METALLURGICAL" || c=="MATERIALS" || c=="MATERIAL"){ 
        if(bq.department) bq.department.push("MEMS"); else {bq.department=[]; bq.department.push("MEMS");}
      }
      if(c == "PHY" || c=="PH" || c=="PHYSICS"){ 
        if(bq.department) bq.department.push("PH"); else {bq.department=[]; bq.department.push("PH");}
      }
      if(c[0]=="H" && !isNaN(c.substring(1))){ 
        if(bq.hostel) bq.hostel.push(c.substring(1)); else {bq.hostel=[]; bq.hostel.push(c.substring(1));}
      }
    }

    console.log(bq);

    results = await service.getSearchResults(bq).catch(err => { next(err); });
    return res.render('results', {
      title: 'Results',
      navbarItems : navbarItems,
      users : results
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
 * POST /search
 * Save predictions
 */
exports.postSearch = async (req, res, next) => {
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
 * POST /addFriends
 * Save predictions
 */
exports.postAddFriendRequest = async (req, res, next) => {
  if (!req.user) {
    logger.info("IP " + req.ip + " /addFriends" + req.params.ldap +"without login");
    return res.redirect('/login');
  }
  console.log(req.body);
  let createRequest = await Request.createRequest(req.body.ldap1, req.body.ldap2).catch(err=>{ next(err); });  
  console.log(createRequest);
  req.flash('success', { msg: 'Friend Request Sent!' });
  res.send(createRequest);
};

/**
 * POST /removeFriends
 * Save predictions
 */
exports.postDeleteFriendRequest = async (req, res, next) => {
  if (!req.user) {
    logger.info("IP " + req.ip + " /removeFriends" + req.params.ldap +"without login");
    return res.redirect('/login');
  }
  console.log(req.body);
  let deleteRequest = await Request.deleteRequest(req.body.ldap1, req.body.ldap2).catch(err=>{ next(err); });  

  console.log(deleteRequest);
  req.flash('success', { msg: 'Friend Request Deleted!' });
  res.send(deleteRequest);
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
              await Notification.createNotification(user.ldap, user.ldap, "Welcome to IITBaba").catch(err=>{console.log(err);});
              req.logIn(user, (err) => {
                if (err) { return next(err); }         
                req.flash('success', { msg: 'Success! Registered.' });
                return res.redirect('/set');
              });
            }
          });
    });
};
/*
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
              });
        });
  });
};*/