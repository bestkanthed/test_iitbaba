let mobileView = $(window).width() < 400 ? true : false

$("svg").attr({
  "width": mobileView ? $(window).width() : $(window).width()/2,
  "height": mobileView ? $(window).height()*3/4 : $(window).height()
})

$.get('/graph'+location.search, response => {

  let { graph, user } = response
  let { links, nodes } = graph
  let profileId = nodes[nodes.length - 1]._id
  var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");
  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var simulation = d3.forceSimulation()
  .force("collide", d3.forceCollide().radius(node => nodes[nodes.length - 1]._id === node._id ? 50 : 30 ))
  .force("link", d3.forceLink().id(node => node.id).distance(mobileView ? 100: 200).strength(0.3))
  .force("charge", d3.forceManyBody().strength(-1000))
  //.force("center", d3.forceCenter(width / 2, height / 2))
  .force("center", d3.forceCenter(width / 2, height / 2))
  
  .force("x", d3.forceX().x(width / 2).strength(node => ( nodes[nodes.length - 1]._id === node._id ? 3.5 : 0)))
  .force("y", d3.forceY().y(height/ 2).strength(node => ( nodes[nodes.length - 1]._id === node._id ? 3.5 : 0)))
  
  //.force("linkDistance", 200);
  //d3.json("miserables.json", function(error, graph) {
  //if (error) throw error;
  
  let defs = svg.append("defs")
    .attr("id", "imgdefs")
    .selectAll("pattern")
    .data(nodes)
    .enter()
    .append("pattern")
    .attr("id", node => node._id)
    .attr("height", 1)
    .attr("width", 1)
    .attr("x", "0")
    .attr("y", "0")
    .append("image")
    .attr("x", node => profileId === node._id ? 25*-0.22 : 15*-0.22)//function(d){return 15*-0.22;}) // return d.sal
    .attr("y", node => profileId === node._id ? 25*-0.22 : 15*-0.22)
    .attr("height", node => profileId === node._id ? 25*4 : 15*4) // return d.sal
    .attr("width", node => profileId === node._id ? 25*4.5 : 15*4.5) // return d.sal
    .attr("xlink:href", function(n){return "/images/profile/"+n.ldap+".png";} )

    var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke-width", 4) // This must depend on the screen size.

    var a = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append('a')
    .attr("xlink:href", node => "/circle?id="+ node._id)
    
    
    let node = a.append("circle")
    .attr("r", node => nodes[nodes.length - 1]._id === node._id ? 50 : 30) // This radius must be dependent on the screen size.
    .attr("fill", node => ("url(#"+node._id+")"))
    .style("cursor", "pointer")

    let relationSuffix
    let center = nodes[nodes.length - 1]
    if(center._id !== user._id) relationSuffix = toProperCase(center.first_name)+"'s"
    else relationSuffix = 'Your'

    simulation
    .nodes(nodes)
    .on("tick", ticked);
    
    simulation.force("link")
    .links(links);
    
    function ticked() {
      link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
      node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
    }

    setTimeout(() => {
      console.log('function running')
      //if(mobileView)
      a.append("text")
      .attr("dx", node => profileId === node._id ? node.x - 13 : node.x - 30)
      .attr("dy", node => node.y + 30)
      .text(node => (profileId === node._id && profileId === user._id) ? 'ME' : node.first_name)

      node.append("title")
      .text(node => `${toProperCase(node.first_name)} ${toProperCase(node.last_name)} ${ node.relationship.length ? `\n${relationSuffix} ${node.relationship.join(' ')}` : '' }`)
    }, 2000)
    
  //});
  
  function recenter(n) {
    console.log('logging node', node)
    //link.exit().remove()
    node = node.data(nodes, function(d) { console.log('logging name', d.name ? 'wow' : 'not'); return d.name; })
    console.log('logging node', node)
    node.exit().remove()
    link = link.data(links, function(d) { return d.name;})
    link.exit().remove()
    /*
    $.get('/graph?id='+node._id, response => {  
    })
    */
  }
})

function toProperCase (string) {
  if(!string) return ''
  return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
}