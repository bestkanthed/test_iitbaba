const mongoose = require('mongoose');
const numeric = require('../matrix/numeric');

// Take care on where to find one and where to find many

const matrixSchema = new mongoose.Schema({
  predictionMatrix : mongoose.Schema.Types.Mixed,
  incomingEdges: mongoose.Schema.Types.Mixed,
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
                        [1, predictionUser], 
                        [predictionBaba, 1]
                    ],
                    incomingEdges: [1,1],
                    totalSum: predictionBaba + predictionUser
                }, (err, resultMat) => {
                    if(err) reject(err);
                    let ev = numeric.eig(resultMat.predictionMatrix);
                    console.log(ev.E);
                    k = resultMat.totalSum/Math.abs((ev.E.x[0][0] + ev.E.x[1][0]));
                    return resolve([k*Math.abs(ev.E.x[0][0]), k*Math.abs(ev.E.x[1][0])]);
                });
            }
            else{

                console.log(mat);
                let newIncomingEdges = mat.incomingEdges;
                newIncomingEdges[0]++; 
                newIncomingEdges.push(1);

                console.log(newIncomingEdges);                
                console.log(mat.incomingEdges);                                

                let newLength = newIncomingEdges.length;

                let newPredictionMatrix = mat.predictionMatrix;
                console.log(newPredictionMatrix);                                
                
                for(let i=1; i<newLength - 1; i++){
                    newPredictionMatrix[0][i] = newPredictionMatrix[0][i]* (newIncomingEdges[0] - 1)/ newIncomingEdges[0];
                }

                console.log(newPredictionMatrix);                                                

                newPredictionMatrix[0].push(predictionUser/ newIncomingEdges[0]);
                console.log(mat.incomingEdges.length);
                for(let i=1; i<newLength - 1; i++){console.log(i); newPredictionMatrix[i].push(0);}
                
                let newUserRow = [];
                newUserRow.push(predictionBaba);
                for(let i=0; i<newLength-1; i++) newUserRow.push(0);
                newPredictionMatrix.push(newUserRow);

                for(let i=1;i<newLength; i++){
                    newPredictionMatrix[i][0] = predictionBaba/newIncomingEdges[i];
                }

                for(let i=0;i<newLength; i++){
                    for(let j=0; j<newLength; j++){
                        if(i==j) newPredictionMatrix[i][j] = 1;
                    }
                }

                console.log("Logging new prediction matrix after adding new user");
                console.log(newPredictionMatrix);

                this.model('Matrix').create({
                    predictionMatrix: newPredictionMatrix,
                    incomingEdges: newIncomingEdges,
                    totalSum: mat.totalSum + predictionBaba + predictionUser
                }, (err, resultMat) => {
                    if(err) reject(err);
                    console.log("inside prediction matrix created callback");                        
                    let ev = numeric.eig(resultMat.predictionMatrix);
                    let vectorTotal = 0;
                    console.log(ev.E);
                    for(let i=0;i<ev.E.x.length;i++) vectorTotal = vectorTotal + Math.abs(ev.E.x[i][0])*resultMat.incomingEdges[i];
                    let k = resultMat.totalSum / vectorTotal;
                    let resultSal = [];
                    for(let i=0;i<ev.E.x.length;i++) resultSal.push(Math.abs(ev.E.x[i][0])*k);
                    return resolve(resultSal);
                });
            }
        });
    });
};

matrixSchema.statics.updateMatrix = function updateMatrix(idfor, idby, prediction) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort : { "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            console.log("Logging Matrix");
            console.log(mat);
            console.log(idfor);
            console.log(idby);
            //increment edges
            console.log(mat.incomingEdges.length);
            for(let i=0; i<mat.incomingEdges.length;i++)
            mat.predictionMatrix[idfor][i] = mat.predictionMatrix[idfor][i]*mat.incomingEdges[idfor]/(mat.incomingEdges[idfor] + 1); 
            
            console.log(mat.predictionMatrix);            

            mat.incomingEdges[idfor] = mat.incomingEdges[idfor] + 1;
            
            mat.predictionMatrix[idfor][idby] = prediction/mat.incomingEdges[idfor];
           
            for(let i=0;i<mat.incomingEdges.length; i++){
                for(let j=0; j<mat.incomingEdges.length; j++){
                    if(i==j) mat.predictionMatrix[i][j] = 1;  
                }
            }
                console.log("Logging new prediction matrix");
                console.log(mat.predictionMatrix);
                
            this.model('Matrix').create({
                predictionMatrix: mat.predictionMatrix,
                incomingEdges: mat.incomingEdges,
                totalSum: mat.totalSum + prediction
            }, (err, resultMat) => {
                if(err) reject(err);
                let ev = numeric.eig(resultMat.predictionMatrix);
                let vectorTotal = 0;
                
                for(let i=0;i<ev.E.x.length;i++) vectorTotal =  vectorTotal + Math.abs(ev.E.x[i][0]) * resultMat.incomingEdges[i];
                let k = resultMat.totalSum / vectorTotal;
                let resultSal = [];
                for(let i=0;i<ev.E.x.length;i++) resultSal.push(Math.abs(ev.E.x[i][0]*k));
                return resolve(resultSal);
            });
        });
    });
};

const Matrix = mongoose.model('Matrix', matrixSchema);
module.exports = Matrix;