const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo')(session);
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const flash = require('express-flash');
const expressValidator = require('express-validator'); 
const winston = require('winston');
const fs = require('fs');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
const morgan = require('morgan');
const logger = require('./utilities/logger');
const fileUpload = require('express-fileupload');

dotenv.load({ path: '.env.test' });

const passportConfig = require('./config/passport');
const app = express();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

app.set('view engine', 'pug');
app.use(fileUpload());
app.use(morgan('combined', {stream: accessLogStream}));

app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit:'50mb'}));
app.use(expressValidator());

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
    clear_interval: 3600
  })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 3600 }));


/**
 * For testing
 */
const testController = require('./controllers/test');


/**
 * For all visitors
 */
const homeController = require('./controllers/home');


/**
 * For all logged in users
 */
const User = require('./models/User');
const userAccountSetupController = require('./controllers/userAccountSetup');
const userAccountSecurityController = require('./controllers/userAccountSecurity');
const userAccountController = require('./controllers/userAccount');
const userProductController = require('./controllers/userProduct');
const companyController = require('./controllers/company');
const match = require('./controllers/match')

/**
 * Open routes
 */

app.get('/createTestUser', testController.createTestUser);

app.get('/', homeController.home);
app.get('/connection', homeController.getConnection);

app.get('/about', homeController.getAbout);

app.get('/invite', homeController.getInvite);

app.get('/login', userAccountSecurityController.getLogin);
app.post('/login', userAccountSecurityController.postLogin);

app.get('/account/forgot', userAccountSecurityController.getForgot);
app.post('/account/forgot', userAccountSecurityController.postForgot);

app.get('/account/reset', userAccountSecurityController.getReset);
app.post('/account/reset', userAccountSecurityController.postReset);

app.get('/auth/iitbsso', passport.authenticate('oauth2', { scope: 'basic profile ldap picture sex phone program insti_address'}));
app.get('/auth/iitbsso/callback', userAccountSecurityController.gotCallback);

app.get('/logout', userAccountSecurityController.logout);

/**
 * Company routes
 */
app.get('/company', companyController.getCompany);

app.get('/company/register', companyController.getRegisterCompany);
app.post('/company/register', companyController.postRegisterCompany);

app.get('/company/:companyId', companyController.getCompanyById);
app.post('/company/:companyId', companyController.postCompanyById);

app.post('/company/:companyId/:internshipId', companyController.postDeleteInternshipById);

/**
 * Closed to user routes
 */

app.use((req, res, next) => {
  // If user is not logged in and trying to use internal paths, save his path
  if (!req.user) {
    if(req.path!='/subscription' && req.path!='/request' && req.path!='/notification') req.session.returnTo = req.path;
    return res.redirect('/login');
  }
  next();
});

app.get('/account/setup/1', userAccountSetupController.getSet);
app.post('/account/setup/1', userAccountSetupController.postSet);

app.get('/account/setup/2', userAccountSetupController.getPicture);
app.post('/account/setup/2', userAccountSetupController.postPicture);

app.get('/account/setup/3', userAccountSetupController.getAverage);
app.post('/account/setup/3', userAccountSetupController.postAverage);

app.use((req, res, next) => {
  if(!req.user.complete) return res.redirect('/account/setup/1');
  if(req.user.complete == 1) return res.redirect('/account/setup/2');
  if(req.user.complete == 2) return res.redirect('/account/setup/3');
  next();
});

app.get('/account/edit', userAccountController.getEdit);
app.post('/account/edit', userAccountController.postEdit);

app.get('/account/edit/picture', userAccountController.getEditProfilePicture);
app.post('/account/edit/picture', userAccountController.getEditProfilePicture);

app.get('/suggestion', userProductController.getPredict);
app.get('/prediction', userProductController.getPredictions);

app.get('/profile/:ldap', userProductController.getProfile);
app.post('/profile/:ldap', userProductController.postProfile);

app.get('/search', userProductController.getSearch);

app.get('/internship', userProductController.getInternshipPage);

app.get('/match', match.getMatch)
app.post('/match', match.postMatch)
app.get('/leaderboard', match.getLeaders)

/*
app.get('/internship/:intern', userProductController.getInternship);
app.post('/internship/:intern', userProductController.postInternship);

app.get('/internship/post', userProductController.getPostInternshipPage);
app.post('/internship/post', userProductController.postPostInternshipPage);

*/


app.get('/circle', userProductController.getCircle);

app.post('/subscription', userProductController.postSubscription);

app.post('/request', userProductController.postRequest);

app.get('/notification', userProductController.getNotification);
app.post('/notification', userProductController.postNotification);

app.get('*', function(req, res){
  return res.render('notFound', { title : 'Not found' });
});

app.use(function (err, req, res, next) {
  logger.error(err.stack);
  console.log(err);
  res.status(500).send(err);
});

app.listen(5000,'0.0.0.0' ,() => {
  console.log('  Press CTRL-C to stop\n');
});