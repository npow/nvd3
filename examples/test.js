var vizTypes = {
  multiBarChart: { ndimensions: 2, nmeasures: 1 },
  radarChart: { ndimensions: 2, nmeasures: 1 },
  parallelSets: { ndimensions: 2, nmeasures: 0 },
  parallelCoordinates: { ndimensions: 0, nmeasures: 2 },
  scatterChart: { ndimensions: 1, nmeasures: 2 },
  stackedArea: { ndimensions: 2, nmeasures: 1 },
  multiBarChartHorizontal: { ndimensions: 2, nmeasures: 1 },
  bubbleChart: { ndimensions: 2, nmeasures: 1 },
  lineChart: { ndimensions: 1, nmeasures: 1 },
  areaChart: { ndimensions: 1, nmeasures: 1 },
  barChart: { ndimensions: 1, nmeasures: 1 },
  barChartHorizontal: { ndimensions: 1, nmeasures: 1 },
  pieChart: { ndimensions: 1, nmeasures: 1 }
};

var types = Object.keys(vizTypes).sort();
types.forEach(function (key) {
  $('#vizType').append($('<option/>').val(key).text(key));
});

function populateSelect2(id, vals) {
  $(id).select2({ tags: vals });
  $(id).on('change', function () {
    $(id + '_val').html($(id).val());
  });
  $(id).select2('container').find('ul.select2-choices').sortable({
    containment: 'parent',
    start: function() { $(id).select2('onSortStart'); },
    update: function() { $(id).select2('onSortEnd'); }
  });

}

d3.csv('OlympicAthletes.csv', function (csv) {
  window.csv = csv;
  window.columnTypes = getColumnTypes(csv);
  window.csvDimensions = getDimensions(csv);
  window.csvMeasures = getMeasures(csv);
  window.csvDateDimensions = getDateDimensions(csv);
  csv.forEach(function (d, i) {
    csvDateDimensions.forEach(function (key) {
      d[key] = chrono.parseDate(d[key]);
    });
  });
  populateSelect2('#dimensionsSelect', csvDimensions);
  populateSelect2('#measuresSelect', csvMeasures.concat(csvMeasures.map(function (x) { return 'Sum ' + x; }).concat(csvMeasures.map(function (x) { return 'Mean ' + x; }))));

//  $('#dimensionsSelect').select2('val', csvDimensions.slice(0, 2));
//  $('#measuresSelect').select2('val', csvMeasures.slice(0, 1));
});

function getColumnTypes(csv) {
  function getColumnType(key) {
    if (chrono.parseDate(csv[1][key])) {
      return "date";
    } else if (!isNaN(parseFloat(csv[1][key]))) {
      return "number";
    }
    return "string";
  }

  var o = {};
  Object.keys(csv[0]).forEach(function (key) {
    o[key] = getColumnType(key);
  });

  return o;
}

function getDateDimensions(csv) {
  var L = [];
  for (var key in columnTypes) {
    if (['date'].indexOf(columnTypes[key]) > -1) {
      L.push(key);
    }
  }
  return L;
}

function getDimensions(csv) {
  var L = [];
  for (var key in columnTypes) {
    if (['string', 'date'].indexOf(columnTypes[key]) > -1) {
      L.push(key);
    }
  }
  return L;
}

function getMeasures(csv) {
  var L = [];
  for (var key in columnTypes) {
    if (columnTypes[key] === "number") {
      L.push(key);
    }
  }
  return L;
}

function transformData(csv, dimensions, measures) {
  var empty = {};
  measures.forEach(function (measure) {
    empty['Sum ' + measure] = 0;
    empty['Mean ' + measure] = 0;
  });
  var rollup = function (d) {
    var o = {};
    measures.forEach(function (measure) {
      o['Sum ' + measure] = d3.sum(d, function (g) { return +g[measure]; });
      o['Mean ' + measure] = d3.mean(d, function (g) { return +g[measure]; });
    });
    return [o];
  };
  var dim2_keys = {};
  var data = d3.nest();
  dimensions.forEach(function (key) {
    data = data.key(function (d) { return d[key]; }).sortKeys(d3.ascending);
  });
  if (rollup) {
    data = data.rollup(rollup);
  }
  data = data.entries(csv); //.slice(0,2000));

  data.forEach(function (dim1) {
    if (dim1.values instanceof Array) {
      dim1.values.forEach(function (dim2) {
        if (dim2.key) dim2_keys[dim2.key] = 1;
      });
    }
  });
  var keys2 = Object.keys(dim2_keys).sort();
  if (keys2.length > 0) {
    data.forEach(function (dim1) {
      var values = keys2.map(function (key) {
        return {
          key: key,
          values: [empty]
        };
      });
      if (dim1.values instanceof Array) {
        dim1.values.forEach(function (dim2) {
          var idx = keys2.indexOf(dim2.key);
          if (idx > -1) {
            values[idx].values = dim2.values;
          }
        });
        dim1.values = values;
      }
    });
  }

  return data;
}

function pieChart(dimensions, measures) {
  dimensions = dimensions.slice(0, 1);
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.pieChart()
      .width(width)
      .height(height)
      .x(function(d) { return d.key })
      .y(function(d) { return d.values[0][measure] });

  d3.select('#container svg')
      .attr('width', width)
      .attr('height', height)
      .datum(data)
      .call(chart);
  
  return chart;
}

function barChart(dimensions, measures) {
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.discreteBarChart()
      .width(width)
      .height(height)
      .staggerLabels(true)
      .showValues(true)
      .x(function(d) { return d.key })
      .y(function(d) { return d.values instanceof Array ? d.values[0][measure] : d[measure] });

  d3.select('#container svg')
      .attr('width', width)
      .attr('height', height)
      .datum([{ key: dimensions[0], values: data }])
      .call(chart);
  
  return chart;
}

function barChartHorizontal(dimensions, measures) {
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.multiBarHorizontalChart()
      .width(width)
      .height(height)
      .margin({top: 30, right: 20, bottom: 50, left: 175})
      .showBarLabels(true)
      .showControls(false)
      .showLegend(false)
      .stacked(true)
      .x(function(d) { return d.key; })
      .y(function(d) { return d.values instanceof Array ? d.values[0][measure] : d[measure]; });

  d3.select('#container svg')
      .attr('width', width)
      .attr('height', height)
      .datum([{ key: dimensions[0], values: data }])
      .call(chart);
  
  return chart;
}

function multiBarChart(dimensions, measures) {
  dimensions = dimensions.slice(0, 2);
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.multiBarChart()
      .width(width)
      .height(height)
      .x(function(d) { return d.key })
      .y(function(d) { return d.values[0][measure] })
      .margin({top: 30, right: 20, bottom: 50, left: 175})
//        .showValues(false)
      .tooltips(true)
      .transitionDuration(250)
      .stacked(true)
      .showLegend(false)
      .showControls(true);

  d3.select('#container svg')
      .attr('width', width)
      .attr('height', height)
      .datum(data)
      .call(chart);

  nv.utils.windowResize(chart.update);

  return chart;
}

function multiBarChartHorizontal(dimensions, measures) {
  dimensions = dimensions.slice(0, 2);
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.multiBarHorizontalChart()
      .x(function(d) { return d.key })
      .y(function(d) { return d.values[0][measure] })
      .margin({top: 30, right: 20, bottom: 50, left: 175})
//        .showValues(false)
      .tooltips(true)
      .transitionDuration(250)
      .stacked(true)
      .showControls(true);

  d3.select('#container svg')
      .attr('width', width)
      .attr('height', height)
      .datum(data)
      .call(chart);

  nv.utils.windowResize(chart.update);

  return chart;
}

function stackedArea(dimensions, measures) {
  dimensions = dimensions.slice(0, 2);
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  var sports = [];
  data[0].values.forEach(function (o) {
    sports.push(o.key);
  });

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.stackedAreaChart()
              .width(width)
              .height(height)
              .x(function(d) { return sports.indexOf(d.key); })
              .y(function(d) { return d.values[0][measure] })
//              .offset('wiggle')
//              .order('default')

  chart.xAxis.tickFormat(function(d) { return sports[d]; });

  var svg = d3.select('#container svg')
    .attr('width', width)
    .attr('height', height)
    .datum(data)

  svg.transition().duration(500).call(chart);
  return chart;
}

function findLineByLeastSquares(values_x, values_y) {
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var count = 0;

  var x = 0;
  var y = 0;
  var values_length = values_x.length;

  if (values_length != values_y.length) {
    throw new Error('The parameters values_x and values_y need to have same size!');
  }

  if (values_length === 0) {
    return [ [], [] ];
  }

  for (var v = 0; v < values_length; v++) {
    x = values_x[v];
    y = values_y[v];
    sum_x += x;
    sum_y += y;
    sum_xx += x*x;
    sum_xy += x*y;
    count++;
  }

  var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
  var b = (sum_y/count) - (m*sum_x)/count;

  return { m: m, b: b };
}

function parallelCoordinates(dimensions, measures) {
  dimensions = dimensions && measures ? dimensions.concat(measures) : csvDimensions.concat(csvMeasures);
  $('#container').addClass('parcoords');

  parcoords = d3.parcoords()("#container")
    .alpha(0.4)
    .mode("queue") // progressive rendering
    .height(d3.max([document.body.clientHeight-100, 220]))
    .margin({
      top: 36,
      left: 0,
      right: 0,
      bottom: 16
    });

  parcoords
    .types(columnTypes)
    .dimensions(dimensions)
    .data(csv)
    .render()
    .reorderable()
    .brushable();
}

function scatterChart(dimensions, measures) {
  dimensions = dimensions.slice(0, 1);
  measures = measures.slice(0, 3);
  var data = transformData(csv, dimensions, csvMeasures);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

//  var chart = nv.models.scatterPlusLineChart()
  var chart = nv.models.scatterChart()
              .width(width)
              .height(height)
              .x(function(d) { return +d[measures[0]] || 0; })
              .y(function(d) { return +d[measures[1]] || 0; })
              .size(function (d) { return +d[measures[2]] || 0; })
              .useVoronoi(false)
              .showDistX(true)
              .showDistY(true)

    chart.xAxis.tickFormat(d3.format('.0f')).axisLabel(measures[0]);
    chart.yAxis.tickFormat(d3.format('.0f')).axisLabel(measures[1]);
    chart.tooltipContent(function(key, x, y, o, fn) {
        return '<h2>' + key + '</h2>';
    });

    // line of best fit
    /*
    var xs=data.map(function (x) { return x.values[0][measures[0]]; })
    var ys=data.map(function (x) { return x.values[0][measures[1]]; })
    var mb = findLineByLeastSquares(xs, ys);
    data.forEach(function (d) {
      d.slope = 0;
      d.intercept = 0;
    });
    data.push({
      key: 'Regression',
      values: [],
      slope: mb.m,
      intercept: mb.b
    });
    */

  var svg = d3.select('#container svg')
    .attr('width', width)
    .attr('height', height)
    .datum(data)

  svg.transition().duration(500).call(chart);
  return chart;
}

function truncate(str, maxLength, suffix) {
	if(str.length > maxLength) {
		str = str.substring(0, maxLength + 1); 
		str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
		str = str + suffix;
	}
	return str;
}

function parallelSets(dimensions, _) {
  var data = csv;

  var width = nv.utils.windowSize().width;
  var height = nv.utils.windowSize().height - 100;
  var chart = d3.parsets()
  .dimensions(dimensions)
  .height(height)
  .width(width);

  var vis = d3.select("#container svg")
      .attr("width", chart.width())
      .attr("height", chart.height() + 50);

  vis.datum(data).call(chart);
}

function bubbleChart(dimensions, measures) {
  dimensions = dimensions.slice(0, 2);
  var measure = measures[0];
  var x_key = dimensions[1];
  var x_vals = [];
  csv.forEach(function (d) {
    if (d[x_key] !== undefined && x_vals.indexOf(d[x_key]) === -1) {
      x_vals.push(d[x_key]);
    }
  });
  x_vals = x_vals.sort();

  var data = transformData(csv, dimensions, csvMeasures);

  var margin = {top: 20, right: 200, bottom: 0, left: 20},
    width = nv.utils.windowSize().width - 300,
    height = nv.utils.windowSize().height * 3;

  var start_x = 0;
  var end_x = x_vals.length - 1;

  var c = d3.scale.category20c();

  var x = d3.scale.linear()
    .range([0, width]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

  xAxis.tickFormat(function (d, i) {
    return x_vals[d];
  });

  var svg = d3.select("#container svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", margin.left + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	x.domain([start_x, end_x]);
	var xScale = d3.scale.linear()
		.domain([start_x, end_x])
		.range([0, width]);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + 0 + ")")
		.call(xAxis);

	for (var j = 0; j < data.length; j++) {
		var g = svg.append("g").attr("class","journal");

		var circles = g.selectAll("circle")
			.data(data[j]['values'])
			.enter()
			.append("circle");

		var text = g.selectAll("text")
			.data(data[j]['values'])
			.enter()
			.append("text");

		var rScale = d3.scale.linear()
      .domain([0, d3.max(data[j]['values'], function(d) {
        return d['values'] instanceof Array ? d['values'][0][measure] : d.values;
      })])
			.range([2, 9]);

		circles
      .attr("cx", function(d, i) {
        return xScale(x_vals.indexOf(d.key));
      })
			.attr("cy", j*20+20)
      .attr("r", function(d) {
        return rScale(d['values'] instanceof Array ? d['values'][0][measure] : d.values);
       })
			.style("fill", function(d) { return c(j); });

		text
			.attr("y", j*20+25)
      .attr("x",function(d, i) {
        return xScale(x_vals.indexOf(d.key))-5;
      })
			.attr("class","value")
      .text(function(d){
        return d['values'] instanceof Array ? d['values'][0][measure] : d.values;
      })
			.style("fill", function(d) { return c(j); })
			.style("display","none");

		g.append("text")
			.attr("y", j*20+25)
			.attr("x",width+20)
			.attr("class","label")
			.text(truncate(data[j].key,30,"..."))
			.style("fill", function(d) { return c(j); })
			.on("mouseover", mouseover)
			.on("mouseout", mouseout);
	};

	function mouseover(p) {
		var g = d3.select(this).node().parentNode;
		d3.select(g).selectAll("circle").style("display","none");
		d3.select(g).selectAll("text.value").style("display","block");
	}

	function mouseout(p) {
		var g = d3.select(this).node().parentNode;
		d3.select(g).selectAll("circle").style("display","block");
		d3.select(g).selectAll("text.value").style("display","none");
	}
}

function areaChart(dimensions, measures) {
  return lineChartHelper(dimensions, measures, true);
}

function lineChart(dimensions, measures) {
  return lineChartHelper(dimensions, measures, false);
}

function lineChartHelper(dimensions, measures, isArea) {
  dimensions = dimensions.slice(0, 1);
  var data = transformData(csv, dimensions, csvMeasures);
  var measure = measures[0];

  var x_key = dimensions[0];
  var x_vals = [];
  csv.forEach(function (d) {
    if (d[x_key] !== undefined && x_vals.indexOf(d[x_key]) === -1) {
      x_vals.push(d[x_key]);
    }
  });
  x_vals = x_vals.sort();
  var xScale = d3.scale.ordinal().domain(x_vals);

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 20;

  var chart = nv.models.lineChart()
    .options({
      margin: {left: 100, bottom: 100},
      x: function(d, i) {
        return i;
      },
      y: function (d) {
        return d.values[0][measure];
      },
      showXAxis: true,
      showYAxis: true,
      useVoronoi: true,
      transitionDuration: 250
    });

  // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
  chart.xAxis
    .axisLabel(dimensions[0])
    .scale(xScale)
    .tickFormat(function (d, i) {
      return x_vals[d];
    });

  chart.yAxis
    .axisLabel(measure)
    .tickFormat(d3.format(',.2f'));

  d3.select('#container svg')
    .attr('width', width)
    .attr('height', height)
    .datum([{ key: x_key, values: data, area: isArea }])
    .call(chart);

  return chart;
}

function radarChart(dimensions, measures) {
  var measure = measures[0];
  var data = transformData(csv, dimensions, csvMeasures);

  data = data.map(function (x) {
    return {
      className: x.key,
      axes: x.values.map(function (y) {
        return { axis: y.key, value: y.values[0][measure] };
      }) //.filter(function (z) { return z.value > 0; })
    };
  });

  var width = nv.utils.windowSize().width - 100,
      height = nv.utils.windowSize().height - 100;
  RadarChart.defaultConfig.w = width;
  RadarChart.defaultConfig.h = height;
  var chart = RadarChart.chart();
  var svg = d3.select('#container svg')
    .attr('width', width)
    .attr('height', height);

  svg.append('g').classed('focus', 1).datum(data).call(chart);
}

function render() {
  var dimensions = $('#dimensionsSelect').select2('val');
  var measures = $('#measuresSelect').select2('val');
  var vizType = $('#vizType').val();

  if (!validParameters(vizType, dimensions, measures)) {
    return;
  }

  $('#container svg').empty();
  $('#container canvas').remove();

  var chart;
  nv.addGraph(function() {
    $('#container').removeClass('parcoords');
    var fn = eval(vizType);
    var chart = fn(dimensions, measures);
    return chart;
  });
}

function validParameters(vizType, dimensions, measures) {
  var settings = vizTypes[vizType];
  if (!settings) {
    alert('Unknown type: ' + vizType);
    return false;
  } else if (dimensions.length < settings.ndimensions || measures.length < settings.nmeasures) {
    alert(vizType + ' needs >= ' + settings.ndimensions + ' dimension(s), >= ' + settings.nmeasures + ' measure(s)');
    return false;
  }
  return true;
}

$(document).ready(function () {
  $('#renderBtn').click(function () {
    render();
  });
});

