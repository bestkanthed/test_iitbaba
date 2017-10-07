const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  ldap: String,
  from: String,
  notification: String,
  salary: {
    new: Number,
    change: Number,
    color: String
  },
  link: String,
  seen: Boolean,
  clicked: Boolean
}, { timestamps: true });

notificationSchema.statics.createNotification = function createNotification(ldap, from, notification) {
  return new Promise ((resolve, reject) => {
      this.model('Notification').create({ 
      ldap: ldap, 
      from: from, 
      notification: notification,
      link: '/profile/'+from,
      seen: false,
      clicked: false
    }, (err, noti)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

notificationSchema.statics.createNotificationWithSalary = function createNotification(ldap, from, notification, salary) {
  return new Promise ((resolve, reject) => {
      this.model('Notification').create({ 
      ldap: ldap, 
      from: from, 
      notification: notification,
      salary:{
        new: salary.salary,
        change: salary.change,
        color: salary.change>0?"green":"red"
      },
      link: '/profile/'+from,
      seen: false,
      clicked: false
    }, (err, noti)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

notificationSchema.statics.getNotifications = function getNotifications(ldap, no) {
  return new Promise ((resolve, reject) => { 
    this.model('Notification').find({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).limit(no).exec((err, noti)=>{
      if(err) reject(err);
      resolve(noti);
    });
  });
};

notificationSchema.statics.seeNotifications = function seeNotifications(ldap) {
  return new Promise ((resolve, reject) => { 
    this.model('Notification').find({ ldap : ldap, seen : false}, (err, notis)=>{
      if(err) reject(err);
      for(noti of notis){
        noti.seen = true;
        noti.save((err)=>{
          if(err) reject(err);
        });
      }
      resolve("seen");  
    });
  });
};

notificationSchema.statics.clickNotification = function clickNotification(id) {
  return new Promise ((resolve, reject) => { 
    this.model('Notification').findOne({ _id : id }, (err, noti)=>{
      if(err) reject(err);
      noti.clicked = true;
      noti.save((err)=>{
        if(err) reject(err);
        resolve("clicked");
      });
    });
  });
};

// This is an instance of the model I have created that I exported.
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

//My first guess is to create fuctions that just return what's required hiding all the bullshit.
// Handle all the error internally