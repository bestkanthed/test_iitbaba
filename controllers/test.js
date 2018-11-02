const Notification = require('../models/Notification');
const Relation = require('../models/Relation');
const User = require('../models/User');

/**
 * GET /testUser
 * creates a test user
 */

exports.testing = async (req, res, next) => {
  console.log('logging user', req.user)
  return res.send()
}

/**
 * GET /testUser
 * creates a test user
 */
exports.testRegister = async (req, res, next) => {    
  req.session.ref = req.query.ref;
  return res.redirect('/createTestUser')
}


exports.createTestUser = async (req, res, next) => {
  
  console.log('will now try to create')
  const n = await User.getNo();
  const user = new User({ldap: "testUser"+n});
  user.profile = {};
  user.profile.first_name =  "testUser"+n;
  user.save();
  console.log('logging user id', user._id)
  let allUsers = await User.getAllLdaps();
  
  for(let one of await allUsers) {
    await Relation.createRelation(user.ldap, one.ldap, user._id, one._id);
    await Relation.createRelation(one.ldap, user.ldap, one._id, user._id);
  }
  
  Notification.createNotification("testUser"+n, "testUser"+n, "Welcome to IIT-baba")

  req.logIn(user, (err) => {
    console.log('eereo in login', err)
    if (err) { return next(err); }         
    //req.flash('success', { msg: 'Success! Registered.' });
    return res.redirect('/account/setup/1');
  });
};