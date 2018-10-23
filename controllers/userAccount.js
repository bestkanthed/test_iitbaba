const logger = require('../utilities/logger');
const User = require('../models/User');

const AWS = require('aws-sdk')
const fs = require('fs')
const im = require('imagickal')

AWS.config.update({
  accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY
})

// Create an S3 client setting the Endpoint to DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com')
const s3 = new AWS.S3({ endpoint: spacesEndpoint })
const bucketName = 'thoughts'


/**
 * GET /picture
 * Get picture page.
 */
exports.getPicture = async (req, res, next) => {
  let keyName = req.params.ldap ? req.params.ldap : req.params.name.slice(0, -4)
  let params = {Bucket: bucketName, Key: keyName}
  s3.getObject(params, (err, data) => {
    if (err) return res.send()
    res.setHeader('Content-Disposition', 'inline')

    /*
    res.setHeader('Content-Disposition', "filename=\"" + file.uploadName.replace(/[^\x20-\x7E]+/g, '') + "\"" );
    if((file.uploadName.split('.').pop()).toLowerCase() === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf')
    }
    */
    return res.send(data.Body)
  })
};

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
 * POST /account/edit/picture
 * posted picture.
 */
exports.postEditProfilePicture = async (req, res, next)=>{
  
  let base64Data = req.body.image_data.replace(/^data:image\/\w+;base64,/, "")
  if(!base64Data) {
    let pic = Math.floor(Math.random() * 79) + 1  
    base64Data = fs.readFileSync('./public/images/profile/default'+pic+'.png')
  }
  base64Data = new Buffer(base64Data, 'base64')

  keyName = req.user.ldap;
  params = { Bucket: bucketName, Key: keyName, Body: base64Data }

  User.findOne({ ldap: req.user.ldap }, (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) {
      s3.putObject(params, async (err, data) => {
        if (err) return next(err);
        req.flash('success', { msg: 'Picture Saved' });
        existingUser.profile.upload_picture = true;
        existingUser.save((err) => {
          return res.redirect('/profile/'+req.user.ldap);
        })
      })
    }
  })
}