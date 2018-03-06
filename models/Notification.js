const mongoose = require('mongoose');
const Subscription = require('./Subscription');
const webPush = require('web-push');
const Email = require('../utilities/email');

const notificationOptions = {
  TTL: 60,
  vapidDetails: {
        subject: 'mailto: bestkanthed@gmail.com',
        publicKey: process.env.vapidPublicKey,
        privateKey: process.env.vapidPrivateKey
    }
};

const notificationSchema = new mongoose.Schema({
  ldap: String,
  from: String,
  notification: String,
  salary: {
    new: Number,
    change: Number,
    percent: Number,
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
    }, async (err, noti)=>{
      if(err) reject(err);
      
      let payload = JSON.stringify({
        from: from,
        notification: notification,
      });

      let send_email = await Email.to(ldap+'@iitb.ac.in', 'IIT-baba', '<div style="text-align:center;"><img src="'+process.env.DOMAIN+'/images/iitbabab.png" height="360"></img><h1>'+notification+'</h1><p>Click <a href="'+process.env.DOMAIN+'/notifications">here</a> to respond </p></div>');
      let pushSubscription = await Subscription.getSubscription(ldap);
      if(pushSubscription){
        if(pushSubscription.endpoint){
          webPush.sendNotification(
            pushSubscription,
            payload,
            notificationOptions
          );
          return resolve("created");
        } else return resolve("no endpoint");
      } else return resolve("no subscription");
    });
  });
};

notificationSchema.statics.createNotificationWithSalary = function createNotification(ldap, from, notification, salary) {
  return new Promise ((resolve, reject) => {
      let color = salary.change>0?"green":"red";
      if(salary.change.toFixed(2)==0) color = "blue";
      this.model('Notification').create({ 
      ldap: ldap, 
      from: from,
      notification: notification,
      salary:{
        new: salary.salary.toFixed(2),
        change: salary.change.toFixed(3),
        percent: ((salary.change*100)/(salary.salary - salary.change)).toFixed(2),
        color: color
      },
      link: '/profile/'+from,
      seen: false,
      clicked: false
    }, async (err, noti)=>{
      if(err) return reject(err);
      let payload = JSON.stringify({
        from: from,
        notification: notification,
        salary: {
          new: salary.salary.toFixed(2),
          change: salary.change.toFixed(3),
          percent: ((salary.change*100)/(salary.salary - salary.change)).toFixed(2),
          color: color
        }
      });
      
      let send_email = await Email.to(ldap+'@iitb.ac.in', 'IIT-baba', '<div style="text-align:center;"><img src="'+process.env.DOMAIN+'/images/iitbabab.png" height="360"></img><h1>'+notification+'</h1><p>Click <a href="'+process.env.DOMAIN+'/notifications">here</a> to respond </p></div>');      
      let pushSubscription = await Subscription.getSubscription(ldap);
      if(pushSubscription){
        webPush.sendNotification(
          pushSubscription,
          payload,
          notificationOptions
        );
        return resolve("created"); 
      }
      else return resolve("no end point");
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