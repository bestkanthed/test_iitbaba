const User = require('../models/User');

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