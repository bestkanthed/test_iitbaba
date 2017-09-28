const Request = require('../models/Request');
const KPoint = require('../models/KPoint');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Authenticity = require('../models/Authenticity');
const Salary = require('../models/Salary');
const SalaryStat = require('../models/SalaryStat');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Matrix = require('../models/Matrix');
const Mean = require('../models/Mean');
const _ = require('lodash');

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
    let unseen_notifications=0;
    let unseen_requests=0;

    // can be implemented faster with a fulfilled Promise calling this 


    for(notification of notifications){
      if(!notification.seen) unseen_notifications++;
    }
    for(request of requests){
      if(!request.seen) unseen_requests++;
    }
    // Send seen unseen
    resolve({
      notifications : {
        notifications : notifications,
        unseen : unseen_notifications
      },
      requests : {
        requests : requests,
        unseen : unseen_requests
      }
    });
  });
};

exports.updateDatabasePostPrediction = (profile, predictor, guess) =>{
  return new Promise(async (resolve, reject) => {
    // mid of the following are stored
    console.log("going to update matrix");    
    let salaries = await Matrix.updateMatrix(profile, predictor, guess);
    console.log("salaries updated");
    let salaryUpdate = await Salary.updateSalaries(salaries);
    console.log("salaries saved");
    return resolve("Database Updated");
  });
}

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
    let salaryChangeNotification = await Notification.createNotification(profile, predictor, (updatedSalary - previousSalary)).catch(err => { reject(err); }); 
    console.log("salaryChangeNotification :");console.log(salaryChangeNotification); 
    resolve("database updation complete");
  });
}

function getSearchResults(query){  // returns the users
    //return results a users
  return new Promise(async (resolve, reject) => {
    let results = await User.getSearchResult(query).catch(err => { reject(err);});
    resolve(results);
  });
};

exports.getSearchResults = getSearchResults;

exports.getBoxSearchResults = (query)=>{
  return new Promise(async (resolve, reject) => {
    
    // built query
    let finalResults =[];
    let results = [];   
    let bq = {};
    let queries = query.split(" "); 
    
    for(q of queries){
      let c = q.toUpperCase();
      let matched = false;
      
      //check if starting with 1n and 9 letter
      if(isRollNo(c)){
        let rq = {};
        rq.rollno = c;
        results = await getSearchResults(rq).catch(err => { reject(err); });
        console.log("Logging rollno search result length : ");
        console.log(results.length);
        if(results.length) finalResults.push.apply(finalResults, results);
        continue;
      }
      
      if(c == "MALE" || c == "BOY" || c == "BOYS" || c == "GUY" || c == "GUYS"){ 
        if(bq.sex) bq.sex.push("male"); else {bq.sex=[]; bq.sex.push("male");} matched = true; continue;
      }
      if(c == "FEMALE" || c == "GIRL" || c == "GIRLS"){ 
        if(bq.sex) bq.sex.push("female"); else {bq.sex=[]; bq.sex.push("female");} matched = true; continue;
      }
      if(c == "B.TECH." || c == "B.TECH" || c == "BTECH" || c == "BACHELOR" || c == "BACHELORS" || c == "UG" || c == "UNDERGRADUATE" || c =="UNDERGRAD" || c == "UNDER"){ 
        if(bq.degree) bq.degree.push("BTECH"); else {bq.degree=[]; bq.degree.push("BTECH");} matched = true;
      }
      if(c == "M.TECH." || c == "M.TECH" || c == "MTECH" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MTECH"); else {bq.degree=[]; bq.degree.push("MTECH");} matched = true;
      }
      if(c == "PH.D." || c == "PH.D" || c == "PHD" || c == "DOCTRATE" || c == "DOC"){ 
        if(bq.degree) bq.degree.push("PHD"); else {bq.degree=[]; bq.degree.push("PHD");} matched = true; continue;
      }
      if(c=="MBA" || c=="BUSSINESS" || c=="ADMINISTRATION" || c=="MASTER" || c =="MANAGEMENT" || c=="PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("EMBA"); else {bq.degree=[]; bq.degree.push("EMBA");} matched = true;
      }
      if(c == "M.SC." || c == "M.SC" || c == "MSC" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MSC"); else {bq.degree=[]; bq.degree.push("MSC");} matched = true;
      }
      if(c=="DD" || c=="DUAL" || c=="INTEGRATED"){ 
        if(bq.degree) bq.degree.push("DD"); else {bq.degree=[]; bq.degree.push("DD");} matched = true; continue;
      }
      if(c == "B.DES." || c == "B.DES" || c == "BDES" || c == "BACHELOR" || c == "BACHELORS" || c == "UG" || c == "UNDERGRADUATE" || c =="UNDERGRAD" || c == "UNDER"){ 
        if(bq.degree) bq.degree.push("BDES"); else {bq.degree=[]; bq.degree.push("BDES");} matched = true;
      }
      if(c == "M.DES." || c == "M.DES" || c == "MDES" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MDES"); else {bq.degree=[]; bq.degree.push("MDES");} matched = true;
      }
      if(c == "M.PHIL." || c == "M.PHIL" || c == "MPHIL" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST"){ 
        if(bq.degree) bq.degree.push("MPHIL"); else {bq.degree=[]; bq.degree.push("MPHIL");} matched = true;
      }
      if(c == "M.MG." || c == "M.MG" || c == "MMG" || c == "MASTER" || c == "MASTERS" || c == "PG" || c == "POSTGRADUATE" || c =="POSTGRAD" || c == "POST" || c =="MANAGEMENT"){ 
        if(bq.degree) bq.degree.push("MMG"); else {bq.degree=[]; bq.degree.push("MMG");} matched = true;
      }
      if(c=="17" || c=="2017" || c=="1ST" || c=="FIRST" || c=="FRESHI" || c=="FRESHIE" || c=="FRESHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2017"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2017");} matched = true; continue;
      }
      if(c=="16" || c=="2016" || c=="2ND" || c=="SECOND" || c=="SOPHI" || c=="SOPHIE" || c=="SOPHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2016"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2016");} matched = true;  continue;
      }
      if(c=="15" || c=="2015" || c=="3RD" || c=="THIRD" || c=="THIRDI" || c=="THIRDIE" || c=="THIRDIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2015"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2015");} matched = true;  continue;
      }
      if(c=="14" || c=="2014" || c=="4TH" || c=="FOURTH" || c=="FOURTHI" || c=="FOURTHIE" || c=="FOURTHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2014"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2014");} matched = true;  continue;
      }
      if(c=="13" || c=="2013" || c=="5TH" || c=="FIFTH" || c=="FIFTHI" || c=="FIFTHIE" || c=="FIFTHIES"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2013"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2013");} matched = true;  continue;
      }
      if(c=="12" || c=="2012" || c=="PASS" || c=="OUT" || c=="ALUM" || c=="ALUMNUS" || c=="ALUMNI"){ 
        if(bq.year_of_joining) bq.year_of_joining.push("2012"); else {bq.year_of_joining=[]; bq.year_of_joining.push("2012");} matched = true;  continue;
      }
      if(c=="AE" || c=="AERO" || c=="AEROSPACE"){ 
        if(bq.department) bq.department.push("AE"); else {bq.department=[]; bq.department.push("AE");} matched = true;  continue;
      }
      if(c=="BB" || c=="BIO" || c=="BIOSCIENCE" || c=="BIOSCIENCES" || c=="BOIENGINEERING"){ 
        if(bq.department) bq.department.push("BB"); else {bq.department=[]; bq.department.push("BB");} matched = true;  continue;
      }
      if(c=="CL" || c=="CHE" || c=="CHEMICAL"){ 
        if(bq.department) bq.department.push("CHE"); else {bq.department=[]; bq.department.push("CHE");} matched = true; continue;
      }
      if(c=="CH" || c=="CHEM" || c=="CHEMISTRY"){ 
        if(bq.department) bq.department.push("CH"); else {bq.department=[]; bq.department.push("CH");} matched = true;  continue;
      }
      if(c=="CLE" ||c=="CE" || c=="CIVIL"){ 
        if(bq.department) bq.department.push("CLE"); else {bq.department=[]; bq.department.push("CLE");} matched = true; continue;
      }
      if(c=="CSE" || c=="CS" || c=="COMPUTER" || c=="COMP"){ 
        if(bq.department) bq.department.push("CSE"); else {bq.department=[]; bq.department.push("CSE");} matched = true; continue;
      }
      if(c=="EE" || c=="ELECTRICAL" || c=="ELEC"){ 
        if(bq.department) bq.department.push("EE"); else {bq.department=[]; bq.department.push("EE");} matched = true; continue;
      }
      if(c=="ESE" || c=="ENERGY" || c=="EN"){ 
        if(bq.department) bq.department.push("ESE"); else {bq.department=[]; bq.department.push("ESE");} matched = true; continue;
      }
      if(c=="HSS" || c=="HUMANITY" || c=="HUMANITIES" || c=="SOCIAL" || c=="HS"){ 
        if(bq.department) bq.department.push("HSS"); else {bq.department=[]; bq.department.push("HSS");} matched = true;  continue;
      }
      if(c=="IDC" || c=="INDUSTRIAL" || c=="DESIGN"){ 
        if(bq.department) bq.department.push("IDC"); else {bq.department=[]; bq.department.push("IDC");} matched = true; continue;
      }
      if(c=="MATH" || c=="MATHS" || c=="MATHEMATICS" || c=="MA" || c=="MM"){ 
        if(bq.department) bq.department.push("MM"); else {bq.department=[]; bq.department.push("MM");} matched = true; continue;
      }
      if(c=="MECH" || c=="ME" || c=="MECHANICAL"){ 
        if(bq.department) bq.department.push("ME"); else {bq.department=[]; bq.department.push("ME");} matched = true; continue;
      }
      if(c=="META" || c=="MEMS" || c=="METALLURGY" || c=="METALLURGICAL" || c=="MATERIALS" || c=="MATERIAL"){ 
        if(bq.department) bq.department.push("MEMS"); else {bq.department=[]; bq.department.push("MEMS");} matched = true; continue;
      }
      if(c == "PHY" || c=="PH" || c=="PHYSICS"){ 
        if(bq.department) bq.department.push("PH"); else {bq.department=[]; bq.department.push("PH");} matched = true; continue;
      }
      if(c[0]=="H" && !isNaN(c.substring(1))){ 
        if(bq.hostel) bq.hostel.push(c.substring(1)); else {bq.hostel=[]; bq.hostel.push(c.substring(1));} matched = true; continue;
      }
      
      if(matched) continue;
      
      // if not all this
      if(isMobileNo(c)){
        let ms = {};
        ms.mobile = c;
        results = await getSearchResults(ms).catch(err => { reject(err); });
        if(results.length) finalResults.push.apply(finalResults, results);
        continue;
      }
      // check starting with 10 digit no
      if(isName(c)){
        
        let ls = {};
        ls.ldap = c.toLowerCase();
        results = await getSearchResults(ls).catch(err => { reject(err); });
        if(results.length){
          console.log("logging matched ldaps");
          console.log(results);          
          finalResults.push.apply(finalResults, results);
          continue;
        }
        
        let fns = {};
        fns.first_name = c;
        results = await getSearchResults(fns).catch(err => { reject(err); });
        if(results.length) finalResults.push.apply(finalResults, results);
        
        let lns = {};
        lns.last_name = c;
        results = await getSearchResults(lns).catch(err => { reject(err); });
        if(results.length) finalResults.push.apply(finalResults, results);
        continue;
      }
   } // loop ends here

    console.log("Logging built query");
    console.log(bq);
    if(_.isEmpty(bq)){
      console.log("bq is empty resolving");
      return resolve(finalResults);
    } 
    ///////// If final results are repeated then make them once /// filter array
    results = await getSearchResults(bq).catch(err => { reject(err); });
    console.log("Logging results");
    console.log(results);
    if(results.length) finalResults.push.apply(finalResults, results);

    console.log("Logging finalResults");
    console.log(finalResults);

    resolve(finalResults);
  });
};

function isMobileNo(c){
  console.log("Checking if a no");
  console.log(c);
  console.log(c.length);
  return c.length==10 && !isNaN(c);
}

function isRollNo(c){
  console.log("Checking if a rollno");
  console.log(c);
  console.log(c.length);
  return c.length==9 && c[0]==1;
}

function isName(c){
  return isNaN(c);
}