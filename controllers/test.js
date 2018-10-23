const Notification = require('../models/Notification');
const Relation = require('../models/Relation');
const User = require('../models/User');

/**
 * GET /testUser
 * creates a test user
 */

exports.createTestUser = async (req, res, next) => {
  
  console.log('will now try to create')
  const n = await User.getNo();
  const user = new User({ldap: "testUser"+n});
  user.profile = {};
  user.profile.first_name =  "testUser"+n;
  user.save();
  let allUsers = await User.getAllLdaps();
  
  for(let one of await allUsers) {
    await Relation.createRelation(user.ldap, one.ldap);
    await Relation.createRelation(one.ldap, user.ldap);
  }
  
  console.log('second last')
  //await Notification.createNotification(user.ldap, user.ldap, "Welcome to IIT-baba");
  
  req.logIn(user, (err) => {
    console.log('eereo in login', err)
    if (err) { return next(err); }         
    req.flash('success', { msg: 'Success! Registered.' });
    return res.redirect('/account/setup/1');
  });
};