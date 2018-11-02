const mongoose = require('mongoose')

/**
 * Connect to MongoDB.
 */
const User = require('../models/User')
const Relation = require('../models/Relation')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/eigen')
mongoose.connection.on('error', (err) => {
  console.error(err)
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', '✗')
  process.exit()
})

async function updateDB() {
    let relations = await Relation.find({})
    //console.log(thoughts.filter(thought => thought.idNextThoughts.length !== 0))
    for(let relation of relations) {
        if(!relation.relationship)
        await Relation.findOneAndUpdate(
            { _id:  relation._id },
            { $set: { relationship : [] } },
        )
        /*
        let user1 = await User.findOne({ ldap : relation.ldap1 })
        let user2 = await User.findOne({ ldap : relation.ldap2 })
        let response = await Relation.findOneAndUpdate(
            { _id:  relation._id },
            { $set: { idUser1 : user1._id, idUser2 : user2._id } },
        )
        */
    }
    return 'done'
}

updateDB().then(() => console.log('done'))