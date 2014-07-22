nv.models.bubbleChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------
  var diameter = 960,
      color = d3.scale.category20c(),
      format = d3.format(",d"),
      getChildren = function(d) { console.log("getchildren"); return d.children; },
      getLabel = function(d) { console.log("getlabel"); return d.name; },
      getSize = function(d) { console.log("getsize"); return d.size; };

  //============================================================
  function chart(selection) {
    selection.each(function(root) {
      var container = d3.select(this);

      var bubble = d3.layout.pack()
          .sort(null)
          .size([diameter, diameter])
          .padding(1.5);

      var svg = container
          .attr('width', diameter)
          .attr('height', diameter)
          .attr('viewbox', [0, 0, diameter, diameter].join(' '))
          .attr('preserveAspectRatio', 'xMinYMid')
          .style('width', diameter + 'px')
          .style('height', diameter + 'px')
          .attr("class", "bubble");

      var node = svg.selectAll(".node")
          .data(bubble.nodes(classes(root))
          .filter(function(d) { return !d.children; }))
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      node.append("title")
          .text(function(d) { return d.className + ": " + format(d.value); });

      node.append("circle")
          .attr("r", function(d) { return d.r; })
          .style("fill", function(d) { return color(d.packageName); });

      node.append("text")
          .attr("dy", ".3em")
          .style("text-anchor", "middle")
          .text(function(d) { return d.className.substring(0, d.r / 3); });

      // Returns a flattened hierarchy containing all leaf nodes under the root.
      function classes(root) {
        var classes = [];

        function recurse(name, node) {
          var children = getChildren(node);
          if (children) children.forEach(function(child) { recurse(getLabel(node), child); });
          else classes.push({packageName: name, className: getLabel(node), value: getSize(node)});
        }

        recurse(null, root);
        return {children: classes};
      }

      });

    return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.diameter = function(_) {
    if (!arguments.length) return diameter;
    diameter = _;
    return chart;
  };

  chart.format = function(_) {
    if (!arguments.length) return format;
    format = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = _;
    return chart;
  };

  chart.children = function(_) {
    if (!arguments.length) return getChildren;
    getChildren = _;
    return chart;
  };

  chart.label = function(_) {
    if (!arguments.length) return getLabel;
    getLabel = _;
    return chart;
  };

  chart.size = function(_) {
    if (!arguments.length) return getSize;
    getSize = _;
    return chart;
  };
  //============================================================

  return chart;
}
