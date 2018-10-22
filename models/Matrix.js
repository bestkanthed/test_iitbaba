const mongoose = require('mongoose');
const matrix = require('node-matrix');

// Take care on where to find one and where to find many

const matrixSchema = new mongoose.Schema({
  predictionMatrix : mongoose.Schema.Types.Mixed,
  eigenVector: mongoose.Schema.Types.Mixed,
  incomingEdges: mongoose.Schema.Types.Mixed,
  totalSum: Number
}, { timestamps: true });

matrixSchema.statics.getLength = function getLength() {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort:{ "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            if(mat) return resolve(mat.incomingEdges.length);
            else return resolve(0);
        });
    });
};

matrixSchema.statics.addNewUserToMatrix = function addNewUserToMatrix(predictionByBaba, predictionForBaba) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort:{ "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            if(!mat){
                let predictionMatrix = [
                        [1, predictionForBaba], 
                        [predictionByBaba, 1]
                    ];
                let eigenVector = closestEigenVector(predictionMatrix, [[0.5], [0.5]]);
               this.model('Matrix').create({
                    predictionMatrix : predictionMatrix,
                    incomingEdges: [1,1],
                    eigenVector : eigenVector,
                    totalSum: predictionByBaba + predictionForBaba
                }, (err, resultMat) => {
                    if(err) reject(err);
                    k = resultMat.totalSum/Math.abs((eigenVector[0][0] + eigenVector[1][0]));
                    return resolve([k*Math.abs(eigenVector[0][0]), k*Math.abs(eigenVector[1][0])]);
                });
            }
            else{
                
                let newIncomingEdges = mat.incomingEdges;
                newIncomingEdges[0]++; // adding prediction for baba
                newIncomingEdges.push(1);
                
                let newLength = newIncomingEdges.length;
                let newPredictionMatrix = mat.predictionMatrix;                         
                
                for(let i=1; i<newLength - 1; i++) newPredictionMatrix[0][i] = newPredictionMatrix[0][i]* (newIncomingEdges[0] - 1)/ newIncomingEdges[0];
                newPredictionMatrix[0].push(predictionForBaba/ newIncomingEdges[0]);
                for(let i=1; i<newLength - 1; i++) newPredictionMatrix[i].push(0);
                let newUserRow = [];
                newUserRow.push(predictionByBaba);
                for(let i=0; i<newLength-1; i++) newUserRow.push(0);
                newPredictionMatrix.push(newUserRow);
                for(let i=1;i<newLength; i++){
                    newPredictionMatrix[i][0] = predictionByBaba/newIncomingEdges[i];
                }
                for(let i=0;i<newLength; i++){
                    for(let j=0; j<newLength; j++){
                        if(i==j) newPredictionMatrix[i][j] = 1;
                    }
                }
                mat.eigenVector.push([1/newLength]);
                let eigenVector = closestEigenVector(newPredictionMatrix, mat.eigenVector);
                this.model('Matrix').create({
                    predictionMatrix: newPredictionMatrix,
                    incomingEdges: newIncomingEdges,
                    eigenVector: eigenVector,
                    totalSum: mat.totalSum + predictionByBaba + predictionForBaba
                }, (err, resultMat) => {
                    if(err) reject(err);
                    let vectorTotal = 0;
                    for(let i=0; i<eigenVector.length; i++) vectorTotal = vectorTotal + Math.abs(eigenVector[i][0])*resultMat.incomingEdges[i];
                    let k = resultMat.totalSum / vectorTotal;
                    let resultSal = [];
                    for(let i=0;i<eigenVector.length;i++) resultSal.push(Math.abs(eigenVector[i][0])*k);
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
            for(let i=0; i<mat.incomingEdges.length;i++)
            mat.predictionMatrix[idfor][i] = mat.predictionMatrix[idfor][i]*mat.incomingEdges[idfor]/(mat.incomingEdges[idfor] + 1); 
            mat.incomingEdges[idfor] = mat.incomingEdges[idfor] + 1;
            mat.predictionMatrix[idfor][idby] = prediction/mat.incomingEdges[idfor];

            for(let i=0;i<mat.incomingEdges.length; i++){
                for(let j=0; j<mat.incomingEdges.length; j++){
                    if(i==j) mat.predictionMatrix[i][j] = 1;  
                }
            }
            let eigenVector = closestEigenVector(mat.predictionMatrix, mat.eigenVector); 
            this.model('Matrix').create({
                predictionMatrix: mat.predictionMatrix,
                incomingEdges: mat.incomingEdges,
                eigenVector : eigenVector,
                totalSum: mat.totalSum + prediction
            }, (err, resultMat) => {
                if(err) reject(err);
                let vectorTotal = 0;
                for(let i=0; i<eigenVector.length; i++) vectorTotal =  vectorTotal + Math.abs(eigenVector[i][0]) * resultMat.incomingEdges[i];
                let k = resultMat.totalSum / vectorTotal;
                let resultSal = [];
                for(let i=0;i<eigenVector.length;i++) resultSal.push(Math.abs(eigenVector[i][0]*k));
                return resolve(resultSal);
            });
        });
    });
};

matrixSchema.statics.updateMatrixRepredict = function updateRepredict(idfor, idby, prediction) {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort : { "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            let previousPrediction = mat.predictionMatrix[idfor][idby] * mat.incomingEdges[idfor];
            mat.predictionMatrix[idfor][idby] = prediction/mat.incomingEdges[idfor];
            let eigenVector = closestEigenVector(mat.predictionMatrix, mat.eigenVector);
            this.model('Matrix').create({
                predictionMatrix: mat.predictionMatrix,
                incomingEdges: mat.incomingEdges,
                eigenVector : eigenVector,
                totalSum: mat.totalSum + prediction - previousPrediction
            }, (err, resultMat) => {
                if(err) reject(err);
                let vectorTotal = 0;
                for(let i=0;i<eigenVector.length;i++) vectorTotal =  vectorTotal + Math.abs(eigenVector[i][0]) * resultMat.incomingEdges[i];
                let k = resultMat.totalSum / vectorTotal;
                let resultSal = [];
                for(let i=0;i<eigenVector.length;i++) resultSal.push(Math.abs(eigenVector[i][0]*k));
                return resolve(resultSal);
            });
        });
    });
};

matrixSchema.statics.getGraph = function getGraph() {
    return new Promise((resolve, reject) => {
        this.model('Matrix').findOne({},{},{sort : { "createdAt" : -1}}, (err, mat)=>{
            if(err) reject(err);
            let graph = {
                nodes:[],
                links:[]
            }
            
            for(let i=0;i<mat.incomingEdges.length; i++){
                for(let j=0; j<mat.incomingEdges.length; j++){
                    if(mat.predictionMatrix[i][j]!=0 && i!=j){
                        graph.links.push({
                            source: j,
                            target: i,
                            value: mat.predictionMatrix[i][j]*mat.incomingEdges.length[i]
                        });
                    }  
                }
            }
        });
    });
};

function closestEigenVector(mat, vec) {
    let mattest = matrix([[0.5], [0.5]]); 
    let mat1 = matrix(mat);
    let mat2 = matrix(vec);
    let difference;
    let ret = [];    

    for(i=0; i<100; i++) {
        matrixTemp = mat2;
        mat2 = matrix.multiply(mat1, mat2);
        mat2 = matrix.multiplyScalar(mat2, 1/norm(mat2));
        difference = matrix.subtract(mat2, matrixTemp);
        differenceNorm = norm(difference);
        if(Math.abs(differenceNorm) < 0.001) break;
    }
    for(i=0; i<mat2.numRows; i++) ret.push(mat2[i]);
    return ret;
}

function norm(matrix){
    let norm = 0;
    for(let i=0; i<matrix.numRows; i++) {
        norm = norm + matrix[i]*matrix[i];
    }
    return Math.sqrt(norm);
}

const Matrix = mongoose.model('Matrix', matrixSchema);
module.exports = Matrix;