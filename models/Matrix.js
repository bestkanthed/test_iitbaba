const mongoose = require('mongoose');
const math = require('mathjs');

// Take care on where to find one and where to find many

const matrixSchema = new mongoose.Schema({
  mid: Number,
  predictionMatrix : Mixed,
  incomingEdges: Mixed,
  totalSum: Number
   // incomingEdges.length is the no of users in the matrix 
}, { timestamps: true });

matrixSchema.statics.createMatrix = function createMatrix() {
    return new Promise((resolve, reject) => {
        this.model('Matrix').count({}, function(err, count){
            if(err) reject(err);
            this.model('Matrix').create({
                mid: count,
                predictionMatrix : [[0]],
                incomingEdges: [0],
                totalSum: 0
            }, (err, mat) => {
                if(err) reject(err);
                resolve(mat.mid);
            });
        });
    });
};

matrixSchema.statics.mergeMatrix = function mergeMatrix(m1, m2) {
    return new Promise((resolve, reject) => {
        if(m2==m1) return resolve("mids are same");
        let mid1 = m2>m1?m1:m2;
        let mid2 = m2>m1?m2:m1;
        // make the smaller mid1
        this.model('Matrix').findOne({mid: mid1}, (err, mat1)=>{
            if(err) reject(err);
            console.log(mat1);
            let matrix1 = math.matrix(mat1.predictionMatrix);
            this.model('Matrix').findOne({mid: mid2}, (err, mat2)=>{
                if(err) reject(err);
                console.log(mat2);
                let newLength = mat1.incomingEdges.length + mat2.incomingEdges.length;
                matrix1.resize([newLength, newLength]);
                let setToReplace = matrix1.subset(math.index(math.range(mat1.incomingEdges.length, newLength), math.range(mat1.incomingEdges.length, newLength)));
                let newMatrix = math.subset(matrix1, setToReplace, mat2.predictionMatrix);
                mat1.predictionMatrix = newMatrix;
                mat1.incomingEdges = mat1.incomingEdges.concat(mat2.incomingEdges);
                mat1.totalSum = mat1.totalSum + mat2.totalSum; 
                mat1.save(err=>{
                    if(err) reject(err);
                    this.model('Matrix').remove({mid: mid2}, err=>{if(err) reject(err); resolve("Combined");});
                });
            });
            //delete mat2
        });
    });
};

matrixSchema.statics.updatePredictionMatrix = function updatePredictionMatrix(mid, prediction, idfor, idby) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({mid: mid}, (err, mat)=>{
            if(err) reject(err);
            console.log(mat);
            //increment edges
            for(let i=0; i<mat.incomingEdges.length;i++)
            mat.predictionMatrix[idfor][i] = mat.predictionMatrix[idfor][i]*mat.incomingEdges[idfor]/(mat.incomingEdges[idfor] + 1); 
            mat.incomingEdges[idfor] = mat.incomingEdges[idfor] + 1;
            mat.predictionMatrix[idfor][idby] = prediction/mat.incomingEdges[idfor];
            mat.totalSum = mat.totalSum + prediction;
            mat.save(err=>{
                if(err) reject(err);
            });

            // calculate the eigen values for the matrix formed 

            // return array salaries for all the users

        });
    });
};


const Relation = mongoose.model('Relation', relationSchema);
module.exports = Relation;