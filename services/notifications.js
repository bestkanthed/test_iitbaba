const Notification = require('../models/Notification');

exports.getNotifications = (ldap ,no_of_notifications, sort)=> {
    Notification.find({ldap: ldap},{},{sort:{'createdAt': sort}}).limit(no_of_notifications).exec((err, noti)=>{
        if (err) { return next(err); reject(err); }
        return noti;
    });
}