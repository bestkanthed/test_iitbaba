const logs = require('./logger');
const nodemailer = require('nodemailer');

/**
 * Email Config
 */

let transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: '465',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.PASSWORD
    },
    secure:true,
    tls: {  
        rejectUnauthorized: false
    }
});

exports.to = (email, subject, html) => {
    return new Promise((resolve, reject) => {
      let mailOptions = {
          from: process.env.EMAIL_ID,
          to: email.toLowerCase(), 
          subject: subject,
          html: html
      }

      transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
              console.log("Error occured in", mailOptions);
              console.log("Error in sending mail", error);
              return resolve(false);   
          }
          return resolve(true);
      });
    });
};