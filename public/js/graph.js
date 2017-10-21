var graph = !{JSON.stringify(graph).replace(/<\//g, '<\\/')};
      console.log(graph);
      var svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");
      var color = d3.scaleOrdinal(d3.schemeCategory20);
      var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(300).strength(0.3))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));
      //.force("linkDistance", 200);
      //d3.json("miserables.json", function(error, graph) {
        //if (error) throw error;
       let defs = svg.append("defs")
                      .attr("id", "imgdefs")
                      .selectAll("pattern")
                      .data(graph.nodes)
                      .enter()
                      .append("pattern")
                      .attr("id", function(n){return n.ldap?n.ldap:"null";})
                      .attr("height", 1)
                      .attr("width", 1)
                      .attr("x", "0")
                      .attr("y", "0")
                      .append("image")
                      .attr("x", function(d){return d.sal*-0.22;})
                      .attr("y", 0)
                      .attr("height",function(d) { return d.sal*4; })
                      .attr("width", function(d) { return d.sal*4.5; })
                      .attr("xlink:href", function(n){return "/images/profile/"+n.ldap+".png";} )


        var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value)/3; });
        
        var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append('a').attr("xlink:href", function(d) { return "profile/"+ d.ldap; })
        .append("circle")
        .attr("r", function(d) { return d.sal*2; })
        .attr("fill", function(d) { return "url(#"+d.ldap+")"; })
        //.attr("fill", function(d) {catpattern.append("image").attr("xlink:href", "/images/profile/"+d.ldap); return "url(#catpattern)";})
        //.attr("fill", function(d) { return color(d.group); })
        .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
        
        node.append("title")
        .text(function(d) { return d.name; });
        
        simulation
        .nodes(graph.nodes)
        .on("tick", ticked);
        
        simulation.force("link")
        .links(graph.links);
        
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
      //});
      
      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    //img.baba(src="/images/iitbabab.png" alt="iitbaba" height="480")