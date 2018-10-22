const logger = require('../utilities/logger');

const User = require('../models/User');

const fs = require('fs');
const im = require('imagickal');


/**
 * GET /edit
 * Get edit page.
 */
exports.getEdit = async (req, res, next) => {
  return res.render('account/edit', {
    title: 'Edit'
  });
};

/**
 * POST /edit
 * Edit details.
 */
exports.postEdit = (req, res, next) => {
  
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
        return res.redirect('/profile/'+req.user.ldap);
      });
    }
  });
};

/**
 * GET /edit/picture
 * Get edit picture page.
 */
exports.getEditProfilePicture = async (req, res, next) => {
  return res.render('account/picture', {
    title: 'Edit Picture'
  });
};

/**
 * POST /account/setup/2
 * posted picture.
 */
exports.postEditProfilePicture = async (req, res, next)=>{
  let base64Data = req.body.image_data.replace(/^data:image\/png;base64,/, "");
  filename = "./public/images/profile/"+req.user.ldap+".png";
  fs.writeFile(filename, base64Data, 'base64', function(err) {
    if(err) return next(err);
    im.identify("./public/images/profile/"+req.user.ldap+".png", true).then(function (data) {
	    logger.info("Logging picture data", data);
      User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
        if (err) return next(err);
        if (existingUser) {
          existingUser.profile.upload_picture = true;
          existingUser.save((err) => {
            if (err) return next(err);
            req.flash('success', { msg: 'Picture Saved' });
            return res.redirect('/profile/'+req.user.ldap);
          });
        }
      });
    }).catch(err1 => {
      req.flash('errors', {msg: 'Please upload the image again'});
      logger.error("Error in uploading image", err1);
      return res.redirect('back');
    });
  });
};