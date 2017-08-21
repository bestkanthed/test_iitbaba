const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  ldap: String,
  from: String,
  notification: String,
  link: String,
  seen: Boolean,
  clicked: Boolean

}, { timestamps: true });

notificationSchema.methods.createNotifiaction = (ldap, from, notifiction) => {
  return this.model('Notifiaction').create({ 
    ldap: ldap, 
    from: from, 
    notifiction: notifiction, 
    link: '/profile/'+from,
    seen: false,
    clicked: false
    //Ramdom expriment
  }, cb);
}

notificationSchema.methods.getNotifications = (ldap, no, cb) => {
  return this.model('Notifiaction').find({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).limit(no).exec(cb);
}

// This is an instance of the model I have created that I exported.
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;