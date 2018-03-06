const ldp1 = !{JSON.stringify(userp.ldap).replace(/<\//g, '<\\/')};
const ldp2 = !{JSON.stringify(user.ldap).replace(/<\//g, '<\\/')};

$("#sendfr").click(function() {
    if($("#sendfr").attr("sent")=='false'){
        $.post("/addFriendRequest", { ldap1: ldp1, ldap2:ldp2 }).done(function( data ) {
            $("#sendfr").attr("sent", 'true');
            $("#sendfr").text("Friend Request Sent");
        });
    } else {
        $.post("/deleteFriendRequest", { ldap1:"#{userp.ldap}", ldap2:"#{user.ldap}" }).done(function( data ) {
            $("#sendfr").attr("sent", 'false');
            $("#sendfr").text("Send Friend Request");
        });
    } 
});
