// For now I am making the most redundant algorthim you can imagine.
// I'll reason up from here.
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  mid1: Number,
  mid2: Number,
  prediction: Number,
  times : Number
}, { timestamps: true });

predictionSchema.statics.createPrediction = function createPrediction(mid1, mid2, prediction) {
  return new Promise ((resolve, reject) => {
      this.model('Prediction').create({ 
      mid1: mid1, 
      mid2: mid2,
      prediction: prediction,
      times : 1
    }, (err, pred)=>{
      if(err) reject(err);
      resolve("created"); 
    });
  });
};

predictionSchema.statics.getPrediction = function getPrediction(mid1, mid2) {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').findOne({mid1:mid1, mid2:mid2}, {},{sort:{ "createdAt" : -1} }).exec((err, pred)=>{
      if(err) reject(err);
      resolve(pred.prediction);
    });
  });
};

predictionSchema.statics.readNoOfPredictions = function readNoOfPredictions(mid1, mid2) {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').findOne({mid1:mid1, mid2:mid2}, {},{sort:{ "createdAt" : -1} }).exec((err, pred)=>{
      if(err) reject(err);
      if(pred) return resolve(pred.times);
      else return resolve(0);
    });
  });
};

predictionSchema.statics.updatePrediction = function updatePrediction(mid1, mid2, prediction) {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').findOne({mid1:mid1, mid2:mid2}, {},{sort:{ "createdAt" : -1} }).exec((err, pred)=>{
      if(err) reject(err);
      pred.prediction = prediction;
      if(!pred.times) pred.times = 0;
      pred.times++; 
      pred.save((err, pred)=>{
        if(err) reject(err);
        resolve('updated');  
      });
    });
  });
};

predictionSchema.statics.getPredictionsBy = function getPredictionBy(mid) {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').find({mid2:mid}, {},{sort:{ "createdAt" : -1} }).exec((err, pred)=>{
      if(err) reject(err);
      resolve(pred);
    });
  });
};

predictionSchema.statics.getPredictionsFor = function getPredictionFor(mid) {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').find({mid1:mid}, {},{sort:{ "createdAt" : -1} }).exec((err, pred)=>{
      if(err) reject(err);
      resolve(pred);
    });
  });
};

predictionSchema.statics.getMeanFor = function getPredictionFor(mid) {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').find({mid1:mid}, {},{sort:{ "createdAt" : -1} }).exec((err, predictions)=>{
      if(err) reject(err);      
      let mean = 0;
      for(prediction of predictions) {
        mean = mean + prediction.prediction;
      }
      return resolve(mean/predictions.length);
    });
  });
};

predictionSchema.statics.getGraphLinks = function getGraphLinks() {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').find({}, (err, allPredictions)=>{
      if(err) reject(err);
      //console.log("Logging all predictions ", allPredictions);      
      let links = [];
      for(pred of allPredictions){
        links.push({
            source: pred.mid2.toString(),
            target: pred.mid1.toString(),
            value: pred.prediction
        });
      }
      //console.log("Logging links ", links);
      return resolve(links);
    });
  });
};

predictionSchema.statics.getGraphFirstLinks = function getGraphFirstLinks() {
  return new Promise ((resolve, reject) => {
    this.model('Prediction').find({}, (err, allPredictions)=>{
      if(err) reject(err);
      let links = [];
      for(pred of allPredictions){
        links.push({
            source: pred.mid2.toString(),
            target: pred.mid1.toString(),
            value: pred.prediction
        });
      }
      resolve(links);
    });
  });
};

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;