// If I am so smart and it is so easy then ...
// my judging will it work or not is stupid
// Not is fixed
// Make a clever and fast algorithm later

let User = require('../models/User')

exports.getLeaders = async (req, res) => {
    
    let leaders = await new Promise((resolve, reject) => {
            User.find({}).sort({rating : -1}).limit(10).exec((err, inmates) => {
            if(err) reject(err)
            resolve(inmates)
        })
    })

    return res.render('leaderboard', {
        title: 'Leaders',
        leaders
    });
}

exports.getMatch = async (req, res) => {
    
    let allUsers = await new Promise((resolve, reject) => {
        User.find({ _id : { $ne : req.user._id } }).exec((err, inmates) => {
            if(err) reject(err)
            resolve(inmates)
        })
    })

    let indices = allUsers.length

    if(indices <= 1) return res.render('match', {
        title: 'Match',
        user1 : allUsers[0],
        user2 : allUsers[0]
      });

    let index1 = Math.floor(Math.random()*indices); 
    let index2 = Math.floor(Math.random()*indices);
    
    while (index2 === index1) {
        index2 = Math.floor(Math.random()*indices);
    }
    
    return res.render('match', {
      title: 'Match',
      user1 : allUsers[index1],
      user2 : allUsers[index2]
    });
};


exports.postMatch = async (req, res, next) => {
    
    let winner = JSON.parse(req.body.winner)
    let loser = JSON.parse(req.body.loser)

    if ( winner._id === loser._id ) {
        return res.redirect('/match')
    }

    if(!loser.rating) loser.rating = 12
    if(!winner.rating) winner.rating = 12

    console.log('logging rating of winner and loser', winner.rating, loser.rating)

    const winnerExpectedScore = 1 / ( 1 + Math.pow(10, (loser.rating - winner.rating)) )

    winner.rating = winner.rating + (1 - winnerExpectedScore)
    loser.rating = loser.rating - winnerExpectedScore

    let saveWinner = await new Promise((resolve, reject) => {
        User.updateOne({ _id : winner._id }, { $set : { rating : winner.rating } }).exec((err, winner) => {
            if(err) reject(err)
            resolve('saved')
        })
    })
    
    let saveLoser = await new Promise((resolve, reject) => {
        User.updateOne({ _id : loser._id }, { $set : { rating : loser.rating } }).exec((err, loser) => {
            if(err) reject(err)
            resolve('saved')
        })
    })

    return res.redirect('/match')
};

    // return if match doesnt exist for this person

    // find someone below and it that is hostel or dep
    // if no one either above or below, replace with the close
    // if already matched match next, if all matched
    // send
    // create a list of game with is linked with with who predicted
    // 
    // maintain rating
    // from rating get the first
    // linked lists to save what is needed