const User = require('../models/User');

// You will need to change the postitoins all your awaits
// Add awaits only when you need the things
exports.getRelation = (ldap1, ldap2) =>{
    return new Promise((resolve, reject)=>{
        
        let [user1, user2] = await Promise.all([User.getUser(ldap1), User.getUser(ldap2)]).catch(err => { reject(err); });

        let rel_coff = 0;
        
        if(user1.profile.deg_type === user2.profile.deg_type) {
            rel_coff = rel_coff + 10;
            rel_coff = rel_coff + 6 - Math.abs(user1.profile.program.join_year - user2.profile.program.join_year);  
        } else rel_coff++;
        if(user1.profile.program.department === user2.profile.program.department) rel_coff = rel_coff + 4;
        if(user1.profile.insti_address.hostel === user2.profile.insti_address.hostel) rel_coff = rel_coff + 3;
        if(user1.profile.sex !== user2.profile.sex) rel_coff = rel_coff + 2;
        
        resolve(rel_coff);
    });
};