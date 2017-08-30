const mongoose = require('mongoose');

const salaryStatSchema = new mongoose.Schema({ // This the mean and sigma of the current salariies to calculate the weight of the predictor
  mean : Number,
  std : Number,
  n : Number
}, { timestamps: true });

const SalarytStat = mongoose.model('SalaryStat', salaryStatSchema);
module.exports = SalaryStat;