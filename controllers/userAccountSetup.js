const logger = require('../utilities/logger');
const fs = require('fs');
const im = require('imagickal');
const s3 = require('../config/awsS3')

const Matrix = require('../models/Matrix');
const Mean = require('../models/Mean');
const Salary = require('../models/Salary');
const User = require('../models/User');
const Referal = require('../models/Referal')

/**
 * GET /account/setup/1
 * Set basic info page.
 */
exports.getSet = async (req, res, next) => {
  if(req.user.complete) return res.redirect('/account/setup/2');
  return res.render('account/set', {
    title: 'Set Password'
  });
};

/**
 * POST /set
 * Set usermane and password.
 */
exports.postSet = async (req, res, next) => {

  req.assert('first', 'First name cannot be blank').notEmpty();  
  req.assert('last', 'Last name cannot be blank').notEmpty();  
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.assert('confirm', 'Password and confirm password do not match').equals(req.body.password);
  const errors = req.validationErrors();

  if (errors) {
    logger.info(req.user+" : password and set password don't match");
    req.flash('errors', errors);
    return res.redirect('/set');
  }

  User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) {
      existingUser.password = req.body.password;
      existingUser.first_name = req.body.first.toUpperCase();
      existingUser.last_name = req.body.last.toUpperCase();
      //add in second form
      // existingUser.known = req.body.known.toUpperCase();
      // existingUser.skills = req.body.skills.toUpperCase();
      // existingUser.hobbies = req.body.hobbies.toUpperCase();
      existingUser.complete = 1;
      existingUser.save((err) => {
        if (err) { 
          logger.error(err);
          return next(err); 
        }
        req.flash({ msg: 'Profile updated' });
        return res.redirect('/account/setup/2');
      });
    }
  });
};

/**
 * GET /account/setup/2
 * Set picture page.
 */
exports.getPicture = async (req, res, next) => {
  if(!req.user.complete) return res.redirect('/account/setup/1');    
  if(req.user.complete>1) return res.redirect('/account/setup/3');  
  return res.render('account/picture', {
    title: 'Upload Profile Picture'
  });
};

/**
 * POST /account/setup/2
 * posted picture.
 */
exports.postPicture = async (req, res, next)=>{
  
  let base64Data = req.body.image_data.replace(/^data:image\/\w+;base64,/, "")
  if(!base64Data) {
    let pic = Math.floor(Math.random() * 79) + 1  
    base64Data = fs.readFileSync('./public/images/profile/default'+pic+'.png')
  }
  base64Data = new Buffer(base64Data, 'base64')
  
  keyName = 'profile/'+req.user.ldap;
  params = { Key: keyName, Body: base64Data }

  User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) {
      s3.putObject(params, async (err, data) => {
        if (err) return next(err);
        //req.flash('success', { msg: 'Picture Saved' });
        existingUser.profile.upload_picture = true;
        existingUser.complete = 2;
        existingUser.save((err) => {
          return res.redirect('/account/setup/3');
        })
      })
    }
  })
  /*
  filename = "./public/images/profile/"+req.user.ldap+".png";
  fs.writeFile(filename, base64Data, 'base64', function(err) {
    if(err) return next(err);
    im.identify("./public/images/profile/"+req.user.ldap+".png", true).then(function (data) {
	    logger.info("Logging picture data", data);
      User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
        if (err) return next(err);
        if (existingUser) {
          existingUser.profile.upload_picture = true;
          existingUser.complete = 2;
          existingUser.save((err) => {
            if (err) return next(err);
            req.flash('success', { msg: 'Picture Saved' });
            return res.redirect('/account/setup/3');
          });
        }
      });
    }).catch(err1 => {
      //req.flash('errors', {msg: 'Please upload the image again'});
      logger.error("Error in uploading image", err1);
      existingUser.complete = 2;
      existingUser.save((err) => {
        if (err) return next(err);
        req.flash('success', { msg: 'Picture Saved' });
        return res.redirect('/account/setup/3');
      });
      //return res.redirect('back');
    });
  });
  */
};

/**
 * GET /avg
 * avg page.
 */
exports.getAverage = async (req, res, next) => {
  if(!req.user.complete) return res.redirect('/account/setup/1');    
  if(req.user.complete == 1) return res.redirect('/account/setup/2');
  if(req.user.complete == 3) return res.redirect('/suggestion');
  return res.render('account/avg', {
    title: 'Your Estimate'
  });
};

/**
 * POST /avg
 * posted avg.
 */
exports.postAverage = async (req, res, next) => {
  let userPredictionForBaba = Number(req.body.babaSalary);
  if(userPredictionForBaba < 3.5 || userPredictionForBaba > 35){
    req.flash('errors', 'Not a good estimate');
    return res.redirect('/account/setup/3');
  }
  let mean = await Mean.getMean(); 
  let newMean = {
    total : mean.total + userPredictionForBaba,
    n: mean.n + 1
  }

  let complete = await User.setComplete(req.user.ldap, 3);  
  let createMean = await Mean.newMean(newMean);
  let salaries = Matrix.addNewUserToMatrix(newMean.total/newMean.n, userPredictionForBaba);
  let setMid = User.setMID(req.user.ldap, (await salaries).length - 1);
  let updateSalaries = Salary.updateSalaries(await salaries);
  
  if(req.session.ref) Referal.create({
    idReferedBy: req.session.ref,
    idReferedTo: req.user._id
  })

  //req.flash('success', { msg: 'Saved' });
  return res.redirect('/suggestion');

};