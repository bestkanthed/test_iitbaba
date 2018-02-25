const Matrix = require('./Matrix');
const Salary = require('./Salary');
const Prediction = require('./Prediction');
const Relation = require('./Relation');
const User = require('./User');

exports.read = () => {
  return new Promise(async (resolve, reject) => {
    let links = Prediction.getGraphLinks();
    let nodes = [];
    let noOfUsers = Matrix.getLength();
    
    nodes.push({
      id: "0",
      sal: await Salary.getSalary(0), 
      ldap:'iitbaba',
      name: 'IIT-baba'
    });

    for(let i=1;i < await noOfUsers; i++){
      nodes.push({
        id: i.toString(),
        sal: await Salary.getSalary(i), 
        ldap: await User.getUserLdapByMID(i),
        name: await User.getUserNameByMID(i),
      });    
    }
    
    return resolve({
      nodes: nodes,
      links: await links
    });
  });
};

exports.readFor = (ldap) => {
  return new Promise(async (resolve, reject) => {
    
    let noOfUsers = Matrix.getLength();
    let links = Relation.getGraphLinks();
    let nodes = [];

    for(let i=1; i< await noOfUsers; i++){
      let ldap1 = await User.getUserLdapByMID(i);
      let predicted;
      let name = await User.getUserNameByMID(i);
      if(name) name = toTitleCase(name);
      if(ldap1==ldap) predicted = true;
      else predicted = await Relation.getPredicted(ldap1, ldap);
      nodes.push({
        id: i.toString(),
        sal: await Salary.getSalary(i), 
        ldap: ldap1,
        name: name,
        predicted: predicted
      });    
    }

    return resolve({
      nodes: nodes,
      links: await links
    });
  });
};

exports.suggestions = (ldap, no) => {
  return new Promise(async (resolve, reject) => {
    let ldaps = await Relation.findMostRelatedUsers(ldap, no);
    resolve(await User.getUsers(ldaps));
  });
};

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};