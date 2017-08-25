

exports.newPeopleToPredict = (ldap, no)=>{
  return new Promise(function(resolve, reject) {
    await Relation.findMostRelated(ldap, no);
    Relation.find({ldap1 : req.user.ldap}).sort({relation: -1}).limit(20).exec((err, relations)=>{
      if (err) { return next(err); }
      console.log(relations);
      let FoundAll = [];
      for(rel of relations){
        console.log(rel);
        FoundAll.push(new Promise(function(resolved, reject) {
          User.findOne({ldap: rel.ldap2}, (err, usr)=>{
            if (err) { return next(err); reject(err);}
            users.push(usr);
            resolved("Found one");
          });
        }));
      }
      Promise.all(FoundAll).then(() =>{resolve("Done");}).catch((e)=>{console.log(e)}); 
    });
  });

  newPeopleToPredict.then((result)=>{
    console.log("Users :");
    console.log(users);

};



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