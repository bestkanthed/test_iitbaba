const Company = require('../models/Company');
const Internship = require('../models/Internship');
const file = require('../utilities/file');

/**
 * get /company
 * company
 */
exports.getCompany = async (req, res, next) => {
    let companies = Company.getAll();
    return res.render('company', {
      title: 'Companies',
      companies : await companies
    });
};

/**
 * get /company/register
 * get company register form
 */
exports.getRegisterCompany = async (req, res, next) => {
    return res.render('registerCompany', {
      title: 'Register Company'
    });
};

/**
 * post /company/post
 * post company form
 */
exports.postRegisterCompany = async (req, res, next) => {
    
    if(!req.user) return res.redirect('back');
    if(req.user.ldap != 'techfest2015') {
      req.flash(errors, {msg : "You don't have permission to register company"});
      return res.redirect('back');
    }
    
    let add = Company.create(req.body); // the new fashion
    let saveLogo = file.create(req.files.logo, '/images/company/logo/'+req.body.companyName+'.png');
    
    Promise.all([add, saveLogo]).then(values => {
      if (values[0] === 11000) req.flash('errors', {msg : 'This company already exists'});
      else req.flash('success', {msg : 'Company Added'});
      if (!values[1]) req.flash('errors', {msg : 'Logo not saved'});
      return res.redirect('back');
    }).catch(err => {
      logs.error(err);
      req.flash('errors', {msg : 'Fatal error. Report to team.'});
      return res.redirect('back');
    });
};

/**
 * get /company/:companyId
 * company
 */
exports.getCompanyById = async (req, res, next) => {
    let company = Company.getCompany(req.params.companyId);
    let internships = Internship.getByCompanyId(req.params.companyId);
    return res.render('companyProfile', {
      title: company.name,
      company : await company,
      internships : await internships
    });
};

/**
 * post /company/:companyId
 * company
 */
exports.postCompanyById = async (req, res, next) => {
    
    if(!req.user) return res.redirect('back');
    if(req.user.ldap != 'techfest2015') {
      req.flash(errors, {msg : "You don't have permission to register company"});
      return res.redirect('back');
    }
    let add = await Internship.createInternship(req.body); // the new fashion
    req.flash('success', {msg : 'Internship Created'});
    return res.redirect('back');
};

/**
 * get /company/:companyId/:internshipId
 * company
 */
exports.postDeleteInternshipById = async (req, res, next) => {
    
    if(!req.user) return res.redirect('back');
    if(req.user.ldap != 'techfest2015') {
      req.flash(errors, {msg : "You don't have permission to register company"});
      return res.redirect('back');
    }
    let deleteInternship = await Internship.deleteById(req.params.internshipId);
    return res.send('deleted');
};