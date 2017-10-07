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

dotenv.load({ path: '.env.test' });

const User = require('./models/User');
const userController = require('./controllers/user');
const homeController = require('./controllers/home');
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

app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
      req.path == '/account') {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 3600 }));

app.get('/', userController.home);

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);

app.get('/logout', userController.logout);

app.get('/set', userController.getSet);
app.post('/set', userController.postSet);

app.get('/picture', userController.getPicture);
app.post('/picture', userController.postPicture);

app.get('/avg', userController.getAverage);
app.post('/avg', userController.postAverage);

app.get('/predict', userController.getPredict);
app.get('/predictions', userController.getPredictions);

app.get('/profile/:ldap', userController.getProfile);
app.post('/profile/:ldap', userController.postProfile);

app.get('/search', userController.getSearch);

app.post('/request', userController.postRequest);

app.post('/notification', userController.postNotification);

app.get('/auth/iitbsso', passport.authenticate('oauth2', { scope: 'basic profile ldap picture sex phone program insti_address' }));
app.get('/auth/iitbsso/callback', userController.gotCallback);

app.use(function (err, req, res, next) {
  logger.error(err.stack);
  console.log(err);
  res.status(500).send(err);
});

app.listen(3000,'0.0.0.0' ,() => {
  console.log('  Press CTRL-C to stop\n');
});