const logger = require('../utilities/logger');
const email = require('../utilities/email');
const request = require('request');
const passport = require('passport');
const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const ssl = require('ssl-root-cas/latest').inject();

const Relation =  require('../models/Relation');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * GET /callback
 * authenticate account
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
            'redirect_uri': process.env.DOMAIN+'/auth/iitbsso/callback'
        }
    }, function(err, resf) {

        if(err) console.log(err);
        var tokens = JSON.parse(resf.body);
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
          }, async (err1, res1) => {
            
            var info = JSON.parse(res1.body);
            if(!info.username) {
                req.flash('error', { msg: 'Not enough permissions for authorization' });
                return res.redirect('/login');
            }
            user.ldap = info.username;
            let userLogin = User.getUser(info.username);
            if(await userLogin) {
                req.logIn(userLogin, (err) => {
                    if (err) return next(err);
                    req.flash('success', { msg: 'Successful Login!' });
                    return res.redirect('/');
                });
            } else {
              user.initializeUser(info);
              let allUsers = await User.getAllLdaps();
              for(one of allUsers){
                Relation.createRelation(user.ldap, one.ldap);
                Relation.createRelation(one.ldap, user.ldap);
              }
              Notification.createNotification(user.ldap, user.ldap, "Welcome to IITbaba");
              req.logIn(user, (err) => {
                if (err) { return next(err); }         
                req.flash('success', { msg: 'Authentication successful'});
                return res.redirect('/account/setup/1');
              });
            }
          });
    });
};

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  
  if (req.user) {
    return res.redirect('/circle');
  }
  return res.render('account/login', {
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
    if (err) {
      return next(err);
    }
    else if (!user) {
      logger.info(req.body.username + " : username was entered but doesn't exist " + info);
      req.flash('errors', info);
      return res.redirect('/login');
    }
    else {
      req.logIn(user, (err) => {
        if (err) { return next(err); }
        req.flash('success', { msg: 'Success! You are logged in.' });
        if (req.session.returnTo) return res.redirect(req.session.returnTo); 
        return res.redirect('/circle');
      });
    }
  })(req, res, next);
};


/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/internal/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  const resetPassword = () =>
    User
      .findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(() => new Promise((resolve, reject) => {
          req.logIn(user, (err) => {
            if (err) { return reject(err); }
            resolve(user);
          });
        }));
      });

  const sendResetPasswordEmail = (user) => {
    if (!user) { return; }
    let sendEmail = email.to(
      user.ldap+'@iitb.ac.in',
      'IIT-baba Account Password Changed',
      '<h1>IIT-baba Password Changed</h1><p>This is a confirmation that the password for your account has just been changed.</p>'
    );
    sendEmail.then(sent=>{
      if(!sent) req.flash('errors', {msg : 'Email not sent'});
      return true;
    });
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => { if (!res.finished) res.redirect('/internal/login'); })
    .catch(err => next(err));
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/internal/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  const createRandomToken = crypto
    .randomBytesAsync(16)
    .then(buf => buf.toString('hex'));

  const setRandomToken = token =>
    User
      .findOne({ ldap: req.body.ldap })
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Account with that email address does not exist.' });
        } else {
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user = user.save();
        }
        return user;
      });

  const sendForgotPasswordEmail = (user) => {
    if (!user) { return; }
    const token = user.passwordResetToken;
    let sendEmail = email.to(
      user.ldap+'@iitb.ac.in',
      'Reset your password on IIT-baba Account',
      '<h1>You requested for a new password</h1><p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p><p><a href="http://'+process.env.HOST_NAME+'/internal/reset/'+token+'">Click here</a> to go to reset page.</p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>'
    );
    sendEmail.then(sent=>{
      if(sendEmail) req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
      else req.flash('errors', {msg : 'There is an internal problem. Contact support@iitbaba.com'});
      return true;
    });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect('/internal/login'))
    .catch(next);
};

/**
 * GET /logout
 * Log out.
 */

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};