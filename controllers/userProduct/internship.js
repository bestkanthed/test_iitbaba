const email = require('../../utilities/email');
const Internship = require('../../models/Internship');
const file = require('../../utilities/file');

/**
 * get /internship
 * internship
 */
exports.getInternshipPage = async (req, res, next) => {
    let intenrships = Internship.getAllInternships();
    return res.render('internship', {
      title: 'Internships',
      internships : intenrships
    });
};

/**
 * get /internship/post
 * get intenrship form
 */
exports.postInternshipPage = async (req, res, next) => {
    //send mail to bestkanthed@gmail.com
    let sendEmail = email.to('bestkanthed@gmail.com', 'New Application For Internship', '<p>'+req.user.ldap+'</p>');
    let internshipApplication = await Application.newApplication(req.body);
    //req.flash('success', {msg : 'You application is put in processing'});
    return res.redirect('back');
};