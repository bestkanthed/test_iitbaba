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
    let notifications = await Notification.getNotifications(ldap, no).catch(err => { reject(err);});     
    let requests = await Request.getRequests(ldap, no).catch(err => { reject(err); });
    resolve({
      notifications : notifications,
      requests : requests
    });
  });
};


exports.getSearchResults = (query) =>{ 
    //return results a users
  return new Promise(async (resolve, reject) => {
    let results = await User.getSearchResult(query).catch(err => { reject(err);});
    resolve(results);
  });
};



exports.UpdateDatabasePostPrediction = (profile, predictor, guess) =>{
  return new Promise(async (resolve, reject) => {
      // create auth 1,2 point
    console.log("logging profile:");console.log(profile);
    console.log("logging predictor:");console.log(predictor);
    console.log("logging guess:");console.log(guess);

    let salaryMean = await Salary.getMean(profile).catch(err => { reject(err); });
    console.log("logging salaryMean:");console.log(salaryMean);
    let salaryStd = await Salary.getStd(profile).catch(err => { reject(err); });
    console.log("logging salaryStd:");console.log(salaryStd);

    let userSalary = await Salary.getSalary(predictor).catch(err => { reject(err); });
    console.log("logging userSalary:");console.log(userSalary);
    let salWeight = await SalaryStat.getSalaryWeight(userSalary).catch(err => { reject(err); }); //Afty
    let authWeight = await Authenticity.getAuthenticity(predictor).catch(err => { reject(err); });

    console.log("SalaryWeigth :");console.log(salWeight);console.log("authWeigth :");console.log(authWeight);
    
    // change salary and salary stats
    let previousSalary = await Salary.getSalary(profile).catch(err => { reject(err); });
    console.log("previousSalary :");console.log(previousSalary);
    let updatedSalary = await Salary.updateSalary(profile, Number(guess), salWeight, authWeight).catch(err => { reject(err); });
    console.log("updatedSalary :");console.log(updatedSalary);
    let updateSalaryStats = await SalaryStat.updateSalaryStatChangeEntry(updatedSalary, previousSalary).catch(err => { reject(err); });
    console.log("updateSalaryStats :");console.log(updateSalaryStats);
    // change the all auths because of the change in salary
    let newSalaryMean = await Salary.getMean(profile).catch(err => { reject(err); });
    console.log("newSalaryMean :");console.log(newSalaryMean);
    let newSalaryStd = await Salary.getStd(profile).catch(err => { reject(err); });
    console.log("newSalaryStd :");console.log(newSalaryStd);

    let peopleWhoPredictedAlready = await Relation.getLdapsOfPeopleWhoPredicted(profile).catch(err => { reject(err); });
    if(peopleWhoPredictedAlready){
      console.log("peopleWhoPredictedAlready :");console.log(peopleWhoPredictedAlready);
      for(person of peopleWhoPredictedAlready){
        let alreadyDonePrediction = await Prediction.getPrediction(profile, person).catch(err => { reject(err); });
        console.log("alreadyDonePrediction :");console.log(alreadyDonePrediction);
        let corretedKPoint;
        if(newSalaryStd) corretedKPoint = Math.abs((newSalaryMean) - alreadyDonePrediction) / newSalaryStd;
        else corretedKPoint = 0;
        //let authPoint = 1 - erf( Math.abs( (await salaryMean) - guess) / (await salaryStd) );
        console.log("corretedKPoint :");console.log(corretedKPoint);
        let previousKPoint = await KPoint.getKPoint(profile, person).catch(err => { reject(err); });
        console.log("previousKPoint :");console.log(previousKPoint);
        let createCorrectedKPoint = await  KPoint.createKPoint(profile, person, corretedKPoint).catch(err => { reject(err); });
        console.log("createCorrectedKPoint :");console.log(createCorrectedKPoint);
        let correctAuthenticity = await Authenticity.correctAuthenticity(person, corretedKPoint, previousKPoint).catch(err => { reject(err); });
        console.log("corretedAuthenticity :");console.log(correctAuthenticity);
      }
    }
    // Can promisify this too
    let kpoint;
    if(salaryStd) kpoint = Math.abs((salaryMean) - guess) / salaryStd;
    else kpoint = 0;
    console.log("kPoint :");console.log(kpoint);
    //let authPoint = 1 - erf( Math.abs( (await salaryMean) - guess) / (await salaryStd) );
    let createKPoint = await KPoint.createKPoint(profile, predictor, kpoint).catch(err => { reject(err); });
    console.log("createKPoint :");console.log(createKPoint);
    // update avg auth of person
    let updateAuthenticity = await Authenticity.updateAuthenticity(predictor, kpoint).catch(err => { reject(err); });
    console.log("updateAuthenticity :");console.log(updateAuthenticity);
    //Change relation after auth update of all the people
    let changeRelation = await Relation.predicted(profile, predictor).catch(err => { reject(err); });
    console.log("changeRelation :");console.log(changeRelation);
    let salaryChangeNotification = await Notification.createNotification(profile, predictor, "Your income has been changed by " +(updatedSalary - previousSalary)).catch(err => { reject(err); }); 
    console.log("salaryChangeNotification :");console.log(salaryChangeNotification); 
    resolve("database updation complete");
  });
}