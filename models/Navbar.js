const Notification = require('./Notification');
const Request = require('./Request');

exports.readItems = (ldap, no) =>{ 
    //return an object of notifications and requests
  return new Promise(async (resolve, reject) => {
    
    let notifications = Notification.getNotifications(ldap, no);     
    let requests = Request.getRequests(ldap, no);
    
    let unseen_notifications = new Promise(async (resolve, reject) => {
        let unseen_notification=0;
        for(notification of await notifications){
            if(!notification.seen) unseen_notification++;
        }
        return resolve(unseen_notification);
    });
    
    let unseen_requests = new Promise(async (resolve, reject) => {
        let unseen_request=0;
        for(request of await requests){
            if(!notification.seen) unseen_request++;
        }
        return resolve(unseen_request);
    });

    resolve({
      notifications : {
        notifications : await notifications,
        unseen : await unseen_notifications
      },
      requests : {
        requests : await requests,
        unseen : await unseen_requests
      }
    });
  });
};