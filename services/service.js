

exports.getNewPeopleToPredict = (ldap, no)=>{
  return new Promise(async (resolve, reject) => {
    let ldaps = await Relation.findMostRelatedUsers(ldap, no).catch( err => { reject(err); });
    resolve( await User.getUsers(ldaps).catch( err => { reject(err); }));
  });
};


exports.getNavItems = (ldap, no) =>{ 
    //return an object of notifications and requests
  return new Promise(async (resolve, reject) => {
    let [notifications, requests] = await Promise.all([Notification.getNotifiactions(ldap, no), Request.getRequest(ldap, no)]).catch(err => { reject(err); });    
    resolve({
      notifications : notifications,
      requests : requests
    });
  });
}