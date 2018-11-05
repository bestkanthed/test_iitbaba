const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const LocalStrategy = require('passport-local').Strategy;
const request = require('request');
const User = require('../models/User');
const config = require('./config');

passport.serializeUser((user, done) => {
  console.log("Now done will be called");
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ ldap : username }, (err, user) => {
    if (err) { 
      console.log("DB err", err);return done(err); }
    if (!user) {
      return done(null, false, { msg: `LDAP ${username} not found.` });
    }
    user.comparePassword(password, (err, isMatch) => {
      if (err) { console.log("comare pass err", err); return done(err); }
      if (isMatch) {
        return done(null, user);
      }
      return done(null, false, { msg: 'Invalid username or password.' });
    });
  });
}));

/**
 * Sign in using Email and Password.
 */

passport.use('oauth2', new OAuth2Strategy({
    authorizationURL: 'https://gymkhana.iitb.ac.in/sso/oauth/authorize',
    tokenURL: 'https://gymkhana.iitb.ac.in/sso/oauth/token',
    clientID: process.env.IITB_SSO_CLIENT_ID,
    clientSecret: process.env.IITB_SSO_CLIENT_SECRET,
    callbackURL: process.env.DOMAIN+'/auth/iitbsso/callback',
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
     done(null,null);
  }
));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];
  const token = req.user.tokens.find(token => token.kind === provider);
  if (token) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
