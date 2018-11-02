const AWS = require('aws-sdk')
const fs = require('fs')


// Use setting credentials to allow secure connection
let bucketName = 'elasticbeanstalk-ap-northeast-1-549984081346'

AWS.config.region = 'ap-northeast-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-northeast-1:fa53d59e-8846-418c-b5dd-628075ec77e4',
});

// Create an S3 client setting the Endpoint to Amazon
var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: bucketName}
})

fs.readFile('./public/images/profile/default5.png', async (err, data1) => {
    keyName = `profile/150010032`
    params = { Bucket: bucketName, Key: keyName, Body: data1 }
    s3.putObject(params, async (err, data) => {
        console.log('logging error', err)
        console.log('logging response', data)
    })
})