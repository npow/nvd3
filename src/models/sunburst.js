nv.models.sunburst = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------
  var margin = {top: 20, right: 0, bottom: 0, left: 0},
      width = 960,
      height = 700,
      formatNumber = d3.format(",d"),
      getChildren = function(d) { return d.children; },
      getLabel = function(d) { return d.name; },
      getValue = function(d) { return d.value; };

  //============================================================
  function chart(selection) {
    selection.each(function(root) {
      var width = 960,
          height = 700,
          radius = Math.min(width, height) / 2;

      var x = d3.scale.linear()
          .range([0, 2 * Math.PI]);

      var y = d3.scale.sqrt()
          .range([0, radius]);

      var color = d3.scale.category20c();

      var svg = d3.select(this)
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

      var partition = d3.layout.partition()
          .value(function(d) { return d.size; });

      var arc = d3.svg.arc()
          .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
          .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
          .innerRadius(function(d) { return Math.max(0, y(d.y)); })
          .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

      var path = svg.selectAll("path")
          .data(partition.nodes(root))
          .enter().append("path")
          .attr("d", arc)
          .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
          .on("click", click);

      function click(d) {
        path.transition()
          .duration(750)
          .attrTween("d", arcTween(d));
      }

      // Interpolate the scales!
      function arcTween(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function(d, i) {
          return i
              ? function(t) { return arc(d); }
              : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
        };
      }        
    });

    return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.label = function(_) {
    if (!arguments.length) return getLabel;
    getLabel = _;
    return chart;
  };

  chart.value = function(_) {
    if (!arguments.length) return getValue;
    getValue = _;
    return chart;
  };

  chart.children = function(_) {
    if (!arguments.length) return getChildren;
    getChildren = _;
    return chart;
  };
  //============================================================

  return chart;
}
