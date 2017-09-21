const mongoose = require('mongoose');
const math = require('mathjs');

// Take care on where to find one and where to find many

const matrixSchema = new mongoose.Schema({
  predictionMatrix : Mixed,
  incomingEdges: Mixed,
  totalSum: Number
   // incomingEdges.length is the no of users in the matrix 
}, { timestamps: true });

matrixSchema.statics.addNewUserToMatrix = function addNewUserToMatrix(predictionBaba, predictionUser) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort:{ "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            if(!mat){
               this.model('Matrix').create({
                    predictionMatrix : [
                        [0, predictionUser], 
                        [predictionBaba, 0]
                    ],
                    incomingEdges: [1,1],
                    totalSum: predictionBaba + predictionUser
                }, (err, resultMat) => {
                    if(err) reject(err);
                    let ev = numeric.eig(resultMat.predictionMatrix);
                    k = resultMat.totalSum/(ev.E.x[0][0] + ev.E.x[0][1]);
                    return resolve([k*evE.x[0][0], k*ev.E.x[0][1]]);
                });
            }
            
            let newIncomingEdges = mat.incomingEdges;
            newIncomingEdges[0]++; 
            newIncomingEdges.push(1);
            
            let newLength = mat.incomingEdges.length + 1;
            
            let newPredictionMatrix = mat.predictionMatrix;
            
            newPredictionMatrix[0].map(function(x) {return (x * (newIncomingEdges[0] - 1))/ newIncomingEdges[0] });
            newPredictionMatrix[0].push(predictionUser/ newIncomingEdges[0]);
            for(let i=1;i<mat.incomingEdges.length;i++) newPredictionMatrix[i].push(0);
            
            let newUserRow = [];
            newUserRow.push(predictionBaba);
            for(let i=0;i<mat.incomingEdges.length;i++) newUserRow.push(0);
            
            newPredictionMatrix.push(newUserRow);

            this.model('Matrix').create({
                predictionMatrix: newPredictionMatrix,
                incomingEdges: newIncomingEdges,
                totalSum: mat.totalSum + predictionBaba + predictionUser
            }, (err, resultMat) => {
                if(err) reject(err);
                let ev = numeric.eig(resultMat.predictionMatrix);
                let vectorTotal = 0;
                
                for(let i=0;i<ev.E.x.length;i++) vectorTotal = vectorTotal + ev.E.x[i][0];
                let k = resultMat.totalSum / vectorTotal;
                let resultSal = [];
                for(let i=0;i<ev.E.x.length;i++) resultSal.push(ev.E.x[i][0]*k);                
                return resolve(resultSal);
            });
        });
    });
};

matrixSchema.statics.updateMatrix = function updateMatrix(prediction, idfor, idby) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort : { "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            console.log(mat);
            //increment edges
            for(let i=0; i<mat.incomingEdges.length;i++)
            mat.predictionMatrix[idfor][i] = mat.predictionMatrix[idfor][i]*mat.incomingEdges[idfor]/(mat.incomingEdges[idfor] + 1); 
            
            mat.incomingEdges[idfor] = mat.incomingEdges[idfor] + 1;
            
            mat.predictionMatrix[idfor][idby] = prediction/mat.incomingEdges[idfor];
           
            this.model('Matrix').create({
                predictionMatrix: mat.predictionMatrix,
                incomingEdges: mat.incomingEdges,
                totalSum: mat.totalSum + prediction
            }, (err, resultMat) => {
                if(err) reject(err);
                let ev = numeric.eig(resultMat.predictionMatrix);
                let vectorTotal = 0;
                
                for(let i=0;i<ev.E.x.length;i++) vectorTotal = vectorTotal + ev.E.x[i][0];
                let k = resultMat.totalSum / vectorTotal;
                let resultSal = [];
                for(let i=0;i<ev.E.x.length;i++) resultSal.push(ev.E.x[i][0]*k);                
                return resolve(resultSal);
            });
        });
    });
};

const Matrix = mongoose.model('Matrix', matrixSchema);
module.exports = Matrix;