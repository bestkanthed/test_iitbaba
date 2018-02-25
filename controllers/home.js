const Graph = require('../models/Graph');

/**
 * GET /
 * home page.
 */

exports.home = async (req, res, next) => {
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
 * GET /invite
 * Invite page.
 */
exports.getInvite = (req, res) => {
    return res.render('invite', {
      title : 'Invite',
    });
};