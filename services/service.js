const Request = require('../models/Request');
const KPoint = require('../models/KPoint');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Authenticity = require('../models/Authenticity');
const Salary = require('../models/Salary');
const SalaryStat = require('../models/SalaryStat');
const Notification = require('../models/Notification');
const User = require('../models/User');

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
};

exports.UpdateDatabasePostPrediction = (profile, predictor, guess) =>{
  return new Promise(async (resolve, reject) => {
      // create auth 1,2 point
    let salaryMean = Salary.getMean(profile);
    let salaryStd = Salary.getStd(profile);
    
    let userSalary = Salary.getSalary(predictor);
    let salWeight = SalaryStat.getSalaryWeight(await userSalary); //Afty

    let authWeight = Authenticity.getAuthenticity(predictor);
    
    // change salary and salary stats
    let previousSalary = Salary.getSalary(profile);
    let updatedSalary = await Salary.updateSalary(profile, guess, await salWeight, await authWeight);
    let updateSalaryStats = await SalarySchema.updateSalaryStatChangeEntry(await updatedSalary, await previousSalary);
    

    // change the all auths because of the change in salary
    let newSalaryMean = Salary.getMean(profile);
    let newSalaryStd = Salary.getStd(profile);

    let peopleWhoPredictedAlready = await Realtion.getLdapsOfPeopleWhoPredicted(profile);
    for(person of peopleWhoPredictedAlready){
      let alreadyDonePrediction = Prediction.getPrediction(profile, person);
      let corretedKPoint = Math.abs((await newSalaryMean) - await alreadyDonePrediction) / (await newSalaryStd);
      //let authPoint = 1 - erf( Math.abs( (await salaryMean) - guess) / (await salaryStd) );
      let previousKPoint = kPoint.getKPoint(profile, person);
      let createCorrectedKPoint = kPoint.createKPoint(profile, person, await corretedkPoint);
      let corretedAuthenticity = Authenticity.corretedAuthenticity(person, await corretedKPoint, await previousKPoint);
    }

    // Can promisify this too
    let kPoint = Math.abs((await salaryMean) - guess) / (await salaryStd);
    //let authPoint = 1 - erf( Math.abs( (await salaryMean) - guess) / (await salaryStd) );
    let createKPoint = kPoint.createKPoint(profile, predictor, kPoint);
    // update avg auth of person
    let updateAuthenticity = Authenticity.updateAuthenticity(predictor, kPoint);
    //Change relation after auth update of all the people
    let changeRelation = Relation.predicted(profile, predictor);
    let salaryChangeNotification = Notification.createNotifiaction(profile, predictor, "Your income has been changed by " +(updatedSalary - await previousSalary));  
    resolve(await updateAuthenticity + await changeRelation + await salaryChangeNotification + await createKPoint);
  });
}