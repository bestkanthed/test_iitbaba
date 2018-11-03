const Graph = require('../models/Graph')
const Notification = require('../models/Notification')
const Referal = require('../models/Referal')
const Feedback = require('../models/Feedback')

/**
 * GET /
 * home page.
 */
exports.home = async (req, res, next) => {
    //let graph = Graph.read();
    console.log('logging req.session.ref', req.session.ref)
    if(!req.user) return res.render('index', { 
      title : 'Home'
    })

    let feed = (await Notification.aggregate([
      { $match : { ldap : { $ne : req.user.ldap } } },
      { $lookup:
        {
          from: "users",
          localField: "ldap",
          foreignField: "ldap",
          as: "to"
        }
      },
    ])).reverse()

    return res.render('feed', {
      title: 'Home',
      feed
    })
};

exports.getRegister = async (req, res, next) => {    
  req.session.ref = req.query.ref;
  return res.redirect('/auth/iitbsso')
}

/**
 * GET /connection
 * connection page.
 */
exports.getConnection = async (req, res, next) => {
    let graph = Graph.read();
    return res.render('home', { 
      title : 'Home',
      graph: await graph
    });
};

/**
 * GET /about
 * About page.
 */
exports.getAbout = (req, res) => {
  return res.render('about', {
    title : 'About',
  });
};

/**
 * POST /about
 * Post feedback.
 */
exports.postAbout = (req, res) => {
  console.log('logging user feedback', req.body)
  let feedback = Feedback.create(req.body)
  req.flash('success', { msg: 'Thanks. Your feedback is highly valueable.' })
  return res.redirect('/about')
};

/**
 * GET /invite
 * Invite page.
 */
exports.getInvite = async (req, res) => {
  
  if(!req.user) return res.redirect('/login')

  let referals = Referal.aggregate([
    { $match : { idReferedBy : req.user._id } },
    { $lookup:
      {
        from: "users",
        localField: "idReferedTo",
        foreignField: "_id",
        as: "user"
      }
    }
  ])

  return res.render('invite', {
    title : 'Invite',
    referals : await referals
  })
};