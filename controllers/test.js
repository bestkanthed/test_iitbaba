const Notification = require('../models/Notification');
const Relation = require('../models/Relation');
const User = require('../models/User');

/**
 * GET /testUser
 * creates a test user
 */

exports.createTestUser = async (req, res, next) => {
  const n = await User.getNo();
  const user = new User({ldap: "testUser"+n});
  user.profile = {};
  user.profile.first_name =  "testUser"+n;
  user.save();
  let allUsers = User.getAllLdaps();
  for(one of await allUsers) {
    await Relation.createRelation(user.ldap, one.ldap);
    await Relation.createRelation(one.ldap, user.ldap);
  }
  await Notification.createNotification(user.ldap, user.ldap, "Welcome to IIT-baba");
  req.logIn(user, (err) => {
    if (err) { return next(err); }         
    req.flash('success', { msg: 'Success! Registered.' });
    return res.redirect('/account/setup/1');
  });
};