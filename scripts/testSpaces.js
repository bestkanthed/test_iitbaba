const AWS = require('aws-sdk')
const fs = require('fs')
const dotenv = require('dotenv');

dotenv.load({ path: '.env.test' });

// Use setting credentials to allow secure connection
AWS.config.update({
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY
})

// Create an S3 client setting the Endpoint to DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com')
const s3 = new AWS.S3({ endpoint: spacesEndpoint })
const bucketName = 'thoughts'

fs.readFile('./public/images/baba.jpg', async (err, data1) => {
    keyName = `test`
    params = { Bucket: bucketName, Key: keyName, Body: data1 }
    s3.putObject(params, async (err, data) => {
        console.log('logging response', data)
    })
})