const User = require('../models/User');

// You will need to change the postitoins all your awaits
// Add awaits only when you need the things
exports.getRelation = (ldap1, ldap2) =>{
    return new Promise(async (resolve, reject)=>{
        //Promise.all([User.getUser(ldap1), User.getUser(ldap2)]).then((user1, user2)=>{
          user1 = await User.getUser(ldap1);
          user2 = await User.getUser(ldap2);
            let rel_coff = 0;
            //console.log("loggingfromrealtionmatrix");
            //console.log(user1);
            //console.log(user2);
            if(user1.profile.deg_type&&user2.profile.deg_type&&user1.profile.program.join_year&&user2.profile.program.join_year){
                if(user1.profile.deg_type === user2.profile.deg_type) {
                    rel_coff = rel_coff + 10;
                    rel_coff = rel_coff + 6 - Math.abs(user1.profile.program.join_year - user2.profile.program.join_year);  
                } else rel_coff++;
            }
            if(user1.profile.program&&user2.profile.program){
                if(user1.profile.program.department === user2.profile.program.department) rel_coff = rel_coff + 4;
            }
            if(user1.profile.insti_address.hostel === user2.profile.insti_address.hostel) rel_coff = rel_coff + 3;
            if(user1.profile.sex !== user2.profile.sex) rel_coff = rel_coff + 2;
            return resolve(rel_coff);
        //}).catch(err => { reject(err); });
    });
};