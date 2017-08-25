const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  ldap: String,
  from: String,
  notification: String,
  link: String,
  seen: Boolean,
  clicked: Boolean
}, { timestamps: true });

notificationSchema.statics.createNotifiaction = (ldap, from, notifiction) => {
  return new Promise ((resolve, reject) => {
      this.model('Notifiaction').create({ 
      ldap: ldap, 
      from: from, 
      notifiction: notifiction, 
      link: '/profile/'+from,
      seen: false,
      clicked: false
    }, (err, noti)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

notificationSchema.statics.getNotifications = (ldap, no) => {
  return new Promise ((resolve, reject) => { 
    this.model('Notifiaction').find({ ldap: ldap },{},{sort:{ "createdAt" : -1} }).limit(no).exec((err, noti)=>{
      if(err) reject(err);
      resolve(noti);
    });
  });
}

notificationSchema.statics.seen = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Notifiaction').find({ _id : id }, (err, noti)=>{
      if(err) reject(err);
      noti.seen = true;
      noti.save((err)=>{
        if(err) reject(err);
        resolve("seen");
      });
    });
  });
};

notificationSchema.statics.clicked = (id) => {
  return new Promise ((resolve, reject) => { 
    this.model('Notifiaction').find({ _id : id }, (err, noti)=>{
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