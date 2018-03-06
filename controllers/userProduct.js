const User = require('../models/User');
const logger = require('../utilities/logger');

const InvalidPrediction = require('../models/InvalidPrediction');
const Graph = require('../models/Graph');
const Matrix = require('../models/Matrix');
const Mean = require('../models/Mean');
const Navbar = require('../models/Navbar');
const Notification = require('../models/Notification');
const Prediction = require('../models/Prediction');
const Relation = require('../models/Relation');
const Request = require('../models/Request');
const Salary = require('../models/Salary');
const SalaryMatrix = require('../models/SalaryMatrix');
const SalaryStat = require('../models/SalaryStat');
const Search = require('../models/Search');
const Subscription = require('../models/Subscription');
const _ = require('lodash');

const internship = require('./userProduct/internship');

/**
 * Internships
 */
exports.getInternshipPage = internship.getInternshipPage;

exports.getInternship = internship.getInternship;
exports.postInternship = internship.postInternship;

exports.getPostInternshipPage = internship.getPostInternshipPage;
exports.postPostInternshipPage = internship.postPostInternshipPage;

/*
exports.getReviewInternship = internship.getReviewInternship;
exports.postReviewInternship = internship.postReviewInternship;
*/

/**
 * get /circle
 * circle
 */
exports.getCircle = async (req, res, next) => {
    let graph = Graph.readFor(req.user.ldap);
    return res.render('circle', {
      title: 'Circle',
      graph: await graph
    });
};

/**
 * GET /predict
 * Prediction page.
 */
exports.getPredict = async (req, res, next) => {
  let suggestions = Graph.suggestions(req.user.ldap, 10);
  req.flash('success',{ msg : 'People you may know' });
  return res.render('results', {
    title: 'Suggestions',
    users : await suggestions
  });
};

/**
 * GET /predictons
 * Previous Prediction page.
 */
exports.getPredictions = async (req, res, next) => {

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
  for(pred of ipredictions) {
    ip.push({
      ldap: await User.getUserLdapByMID(pred.mid2),
      name: await User.getUserNameByMID(pred.mid2),
      prediction: pred.prediction
    });
  }
  res.render('account/predictions', {
    title: 'Previous Predictions',
    op : op,
    ip: ip
  });
};

/**
 * GET /profile/:ldap
 * Profile page.
 */
exports.getProfile = async (req, res, next) => {
  // here if the req.user.ldap is same as the
  if(req.params.ldap=='iitbaba') {
    return res.redirect('/about');
  }

  let user =  User.getUser(req.params.ldap);
  let requestSent = Request.getRequest(req.params.ldap, req.user.ldap);
  let relationship = Relation.getRelationship(req.params.ldap, req.user.ldap);
  let requestReceived = Request.getRequest(req.user.ldap, req.params.ldap); // can be only true
  let predicted = Relation.getPredicted(req.params.ldap, req.user.ldap);

  // Send ID of the request else send null
  if(!(await user) || (await user).complete!=3) return res.render('nullprofile', {
      title: 'Not Registered'
  });
  if(await user) salary = Salary.getSalary((await user).mid);
  Promise.all([user, salary, requestSent, requestReceived, relationship, predicted]).then(values => {
      if(req.params.ldap==req.user.ldap) values[5] = true;
      let rels = "";

      if(values[4]) {
        for(rel of values[4]) {
          rels = rels + " "+rel;
        }
      }
      return res.render('profile', {
        title: values[0].profile.first_name,
        userp : values[0],
        predicted : values[5],
        relationship: rels,
        salary : values[1] ? values[1].toFixed(2): null,
        requestSent: values[2],
        requestReceived: values[3] == null ? null : values[3].id
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

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  if(Number(req.body.salary)<3.5 || Number(req.body.salary)>100) {
    let inappropriatePrediction = InvalidPrediction.create(req.body.mid, req.user.mid, req.body.salary);
    req.flash('errors', {msg : 'Please try again when you are not high'});
    return res.redirect('back');
  }

  let mean = await Prediction.getMeanFor(req.body.mid);
  if(mean<10) mean = 10;
  if(Number(req.body.salary)<mean/3 || Number(req.body.salary)>mean*3) {
    let inappropriatePrediction = InvalidPrediction.create(req.body.mid, req.user.mid, req.body.salary);
    req.flash('errors', {msg : 'Please re-evaluate and try a more appropriate prediction'});
    return res.redirect('back');
  }

  // There is no need of repredict even in the fornt end
    let noOfPredicts = Prediction.readNoOfPredictions(req.body.mid, req.user.mid, req.body.salary);
    if((await noOfPredicts) > 3) {
        req.flash('errors', {msg : 'You can only predict three times for one person'});
        // here let them to suggstions page
        return res.redirect('/suggestion');
    }
    let updatePrediction;
    if((await noOfPredicts)) updatePrediction = Prediction.updatePrediction(req.body.mid, req.user.mid, req.body.salary);
    else {
        let updateRelation = Relation.predicted(req.params.ldap, req.user.ldap);
        upadatePrediction = Prediction.createPrediction(req.body.mid, req.user.mid, req.body.salary);
    }

    let salary = SalaryMatrix.update(Number(req.body.mid), Number(req.user.mid), Number(req.body.salary), (await noOfPredicts));    
    let notification = Notification.createNotificationWithSalary(req.params.ldap, req.user.ldap, toTitleCase(req.user.first_name)+" predicted for you", (await salary));

    if(req.body.popup) return res.send("predicted");
    req.flash('success', { msg: 'Predicted!' });
    return res.redirect('back');  
};

/**
 * GET /search
 * Prediction page.
 */
exports.getSearch = async (req, res, next) => {
  
 // if search from box
  if(req.query.box) {
    if(_.isEmpty(req.query.box)) return res.render('/predict');
    let finalResults = await Search.box(req.query.box);
    finalResults = _.uniq(finalResults);

    return res.render('results', {
      title: 'Results',
      users : finalResults
    });
  }
  
  if(req.query.page) {
    res.render('search', {
      title: 'Search'
    });
  } else {
    results = await Search.user(req.query);
    res.render('results', {
      title: 'Results',
      users : results
    });
  }
};

/**
 * POST /request
 * action on request
 */

exports.postRequest = async (req, res, next) => {
  if(req.body.relationship) {
    if( typeof req.body.relationship === 'string' ) {
        req.body.relationship = [ req.body.relationship ];
    }
    Relation.setRelationship(req.body.ldap, req.user.ldap, req.body.relationship);
    let relationship = "";
    for(rel of req.body.relationship) {
      relationship = relationship + " "+rel;
    }
    Notification.createNotification(req.body.ldap, req.user.ldap, toTitleCase(req.user.first_name)+" related to you as"+relationship);
    return res.send(relationship);
  } else {
    Relation.setRelationship(req.body.ldap, req.user.ldap, null);    
    return res.send(null);
  }
};

/**
 * GET /navbarItems
 * get all navbarItems
 */

exports.getNotification = async (req, res) => {
  return res.send(await Navbar.readItems(req.user.ldap, 10));
};

/**
 * POST /notification
 * action on notification
 */

exports.postNotification = async (req, res, next) => {
  switch(req.body.action) {
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
  let subscription = JSON.parse(req.body.subscription);
  
  if(subscription) {
    if(subscription.endpoint) return res.send(await Subscription.updateSubscription(req.user.ldap, subscription));
  }
  else return res.send("Invalid subscription to update");
};

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};