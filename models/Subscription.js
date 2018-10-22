// For now I am making the most redundant algorthim you can imagine.
// I'll reason up from here.
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  ldap: String,
  subscription: {
      endpoint: String,
      expirationTime: Number,
      keys:{
          p256dh: String,
          auth: String
      }
  }
}, { timestamps: true });

subscriptionSchema.statics.updateSubscription = function updateSubscription(ldap, subscription) {
  return new Promise ((resolve, reject) => {
      this.model('Subscription').findOne({ldap: ldap}, (err, subs)=>{
        if(err) reject(err);
        if(subs){
            subs.subscription.endpoint = subscription.endpoint;
            subs.subscription.expirationTime = subscription.expirationTime;
            subs.subscription.keys.p256dh = subscription.keys.p256dh;
            subs.subscription.keys.auth = subscription.keys.auth;
            subs.save(err=>{
                if(err) reject(err);
                resolve("updated");
            });
        } else {
            this.model('Subscription').create({ 
                ldap: ldap,
                subscription:{
                    endpoint: subscription.endpoint,
                    expirationTime: subscription.expirationTime,
                    keys:{
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth
                    }
                }
            }, (err, pred)=> {
                if(err) reject(err);
                resolve("created"); 
            });
        }
    });
  });
};

subscriptionSchema.statics.getSubscription = function getSubscription(ldap) {
  return new Promise ((resolve, reject) => {
    this.model('Subscription').findOne({ldap: ldap}, (err, subs)=>{
      if(err) reject(err);
      if(subs) return resolve(subs.subscription);
      else return resolve(null)
    });
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;