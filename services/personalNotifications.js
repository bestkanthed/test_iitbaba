



exports.PersonalNotificationsService = (ldap ,no_of_notifications, sort) =>{ 
    //return an object of notifications and requests

    let notifications = await getNotifiactionService();
    let request = await getRequestService();
    
    let getRequest = new Promise(function(resolve, reject) {
      FriendRequest.find({ldap: req.params.ldap},{},{sort:{'createdAt': -1}}).limit(20).exec((err, fr)=>{
        if (err) { return next(err); reject(err); }
        friendrequest = fr;
        resolve("Done");
      });
    });
  }