// Empty JS for your own code to be here
var barCount = 10;
var initialDateStr = '01 Apr 2017 00:00 Z';

var $loading = $('#cover').hide();
$(document)
  .ajaxStart(function () {
    $loading.show();
  })
  .ajaxStop(function () {
    $loading.fadeOut(500);
  });

$(function() {
  $('#uploadButton').click(function() {
      var form_data = new FormData($('#upload-file')[0]);
      $.ajax({
          type: 'POST',
          url: '/upload',
          data: form_data,
          contentType: false,
          cache: false,
          processData: false,
          success: function(data) {
              displayList(data);
          },
      });
  });
});

function displayList(list){
    $('#stockList').empty();
    list.forEach(l => {
        var item = $('#templates').find(".nav-item").clone();
        item.find(".nav-link").html(l);
        item.find(".nav-link").attr("onclick","displayDetails('" + l + "');");
        $('#stockList').append(item);
    });
}

function displayDetails(company){
    $.ajax({
        type: 'GET',
        url: '/details/' + company,
        contentType: 'application/json',
        success: function(data) {
					updateChart(data)
					$('#details').children("h3").html("Stock "+ company)
					$('#details').children("h5").html("RMSE: "+ data.rmse)
					updateTable(data)
					$('#details').show()
    		}
    });
}

function updateTable(data){
	$('#table-contents').empty();
	for(var i=0;i<data.actual.length;i++){
		var td1, td2, td3;
		var tr = document.createElement('TR');
		td1 = document.createElement('TD');
		td2 = document.createElement('TD');
		td3 = document.createElement('TD');
		td1.appendChild(document.createTextNode(data.actual[i].start));
		td2.appendChild(document.createTextNode(data.actual[i].close));
		td3.appendChild(document.createTextNode(data.predicted[i].close));
		tr.appendChild(td1);
		tr.appendChild(td2);
		tr.appendChild(td3);
		$('#table-contents').append(tr);
	}
}

var ctx = document.getElementById('chart').getContext('2d');
ctx.canvas.width = 1000;
ctx.canvas.height = 250;
var chart = new Chart(ctx, {
	type: 'candlestick',
	data: {
		datasets: [{
			label: 'Actual',
			data: getRandomData(initialDateStr, barCount),
			color: {
				up: '#01ff01',
				down: '#fe0000',
				unchanged: '#999',
			}
		},{
			label: 'Predicted',
			data: getRandomData(initialDateStr, barCount)
		}]
	}
});

function updateChart(data){
	chart.data.datasets[0].data = parseStockData(data.actual);
	chart.data.datasets[1].data = parseStockData(data.predicted);
	chart.update();
}

function parseStockData(data){
	chartData = [];
	data.forEach( d => {
		chartData.push(
			getBar(luxon.DateTime.fromRFC2822(d.start),d)
		);
	});
	return chartData;
}

function getBar(date, data){
	return {
		t: date.valueOf(),
		o: data.open,
		h: data.high,
		l: data.low,
		c: data.close
	};
}

var getRandomInt = function(max) {
	return Math.floor(Math.random() * Math.floor(max));
};

function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function randomBar(date, lastClose) {
	var open = randomNumber(lastClose * 0.95, lastClose * 1.05);
	var close = randomNumber(open * 0.95, open * 1.05);
	var high = randomNumber(Math.max(open, close), Math.max(open, close) * 1.1);
	var low = randomNumber(Math.min(open, close) * 0.9, Math.min(open, close));
	return {
		t: date.valueOf(),
		o: open,
		h: high,
		l: low,
		c: close
	};

}

function getRandomData(dateStr, count) {
	var date = luxon.DateTime.fromRFC2822(dateStr);
	var data = [randomBar(date, 30)];
	while (data.length < count) {
		date = date.plus({days: 1});
		if (date.weekday <= 5) {
			data.push(randomBar(date, data[data.length - 1].c));
		}
	}
	return data;
}

var update = function() {
	var dataset = chart.config.data.datasets[0];

	// candlestick vs ohlc
	var type = document.getElementById('type').value;
	dataset.type = type;

	// color
	var colorScheme = document.getElementById('color-scheme').value;
	if (colorScheme === 'neon') {
		dataset.color = {
			up: '#01ff01',
			down: '#fe0000',
			unchanged: '#999',
		};
	} else {
		delete dataset.color;
	}

	// border
	var border = document.getElementById('border').value;
	var defaultOpts = Chart.defaults.global.elements[type];
	if (border === 'true') {
		dataset.borderColor = defaultOpts.borderColor;
	} else {
		dataset.borderColor = {
			up: defaultOpts.color.up,
			down: defaultOpts.color.down,
			unchanged: defaultOpts.color.up
		};
	}

	chart.update();
};