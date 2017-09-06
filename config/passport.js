const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const LocalStrategy = require('passport-local').Strategy;
const request = require('request');
const User = require('../models/User');
const standard = require('./standard');

passport.serializeUser((user, done) => {
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
  console.log("cnf ldap");
  console.log(username);
  User.findOne({ ldap : username.toLowerCase() }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { msg: `LDAP ${username} not found.` });
    }
    user.comparePassword(password, (err, isMatch) => {
      if (err) { return done(err); }
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
    callbackURL: "http://localhost:8080/auth/iitbsso/callback",
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
      console.log("d");
      console.log(req);
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
