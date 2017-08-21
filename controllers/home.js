/**
 * GET /
 * Home page.
 */
exports.home = (req,res) =>{
    res.render('home', { title : 'Home' });
};