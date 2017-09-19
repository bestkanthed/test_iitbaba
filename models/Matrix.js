const mongoose = require('mongoose');

// Take care on where to find one and where to find many

const matrixSchema = new mongoose.Schema({
  predictionMatrix : Mixed,
  incomingEdges: Mixed
   // this is a number to capture the relation
}, { timestamps: true });

matrixSchema.statics.createMatrix = function createMatrix() {
    return new Promise((resolve, reject) => {
        this.model('Matrix').create({
            predictionMatrix : [[0]],
            incomingEdges: [0]
        }, (err, rel)=>{
            if(err) reject(err);
            resolve("created");
        });
    });
};

matrixSchema.statics.updateMatrixNewUser = function updateMatrixNewUser(idOfFirstPersonWhoPredictedForNewUser, predictionValue) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort:{ "createdAt" : -1} }).exec((err, mat)=>{
            if(err) reject(err);
            console.log(mat);
            let new_mat = mat;
            new_mat.push();
            for(let i=0; i)
        });
        
        this.model('Matrix').create({
            predictionMatrix : [[0]],
            incomingEdges: [0]
        }, (err, rel)=>{
            if(err) reject(err);
            resolve("created");
        });
    });
};

const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;