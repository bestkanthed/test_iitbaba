const Request = require('../models/Request');
const Relation = require('../models/Relation');
const Prediction = require('../models/Prediction');
const Salary = require('../models/Salary');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Matrix = require('../models/Matrix');
const Mean = require('../models/Mean');
const _ = require('lodash');

exports.update = (profile, predictor, guess, repredict) =>{
  return new Promise(async (resolve, reject) => {
    let previousPrediction = await Salary.getSalary(profile);    
    let salaries;
    if(repredict) salaries = await Matrix.updateMatrixRepredict(profile, predictor, guess);
    else salaries = await Matrix.updateMatrix(profile, predictor, guess);
    let salaryUpdate = await Salary.updateSalaries(salaries);
    return resolve({
      salary: salaries[profile],
      change: salaries[profile] - previousPrediction
    });
  });
};