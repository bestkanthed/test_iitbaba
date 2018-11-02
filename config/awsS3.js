const AWS = require('aws-sdk')

// Use setting credentials to allow secure connection
let bucketName = 'elasticbeanstalk-ap-northeast-1-549984081346'

AWS.config.region = 'ap-northeast-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-northeast-1:fa53d59e-8846-418c-b5dd-628075ec77e4',
});

// Create an S3 client setting the Endpoint to Amazon
let s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName }
})

module.exports = s3