$( document ).ready(function() {
	var socket = io();
	var $rectangle = $("#rectDiv")
	var rectBox = $rectangle.get(0).getBoundingClientRect();
	var appStartTime = new Date();

	function getRandomColor() {
		return '#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
	}

	function Rectangle (w, h, x, y) {
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;

		this.setId = function(id) {
			this.id = id;
		}

		this.contains = function (x, y) {
			return this.x <= x && x <= this.x + this.width &&
				   this.y <= y && y <= this.y + this.height;
		}

		this.draw = function () {
			var color = getRandomColor();
			var $newdiv = $('<div/>').css({
				'width':this.width+'px',
				'height':this.height+'px',
				'background-color': color
			 });

			$newdiv.css({
				'position':'absolute',
				'left':this.x+'px',
				'top':this.y+'px',
			}).appendTo($rectangle);    
		
			$newdiv.html(this.id);

			var $li = $('<li>' + this.id + '</li>')
			$li.attr('id', 'li_' + this.id);
			$("#stats").append($li);
		}
	}

	function drawTrail(data) {
		var $trail = $("<div></div>");

		$trail.css({
			position: 'absolute',
			top: data.y,
			left: data.x,
			'background-color': data.color || 'white'
		});


		$trail.addClass('smallbox');
		$rectangle.append($trail);
	}

	var rectangles = [];
	var statsCache = {};
	var MAX_RECTANGLES = 10;

	function drawRectangles() {
		for(var i=0; i<MAX_RECTANGLES; i++) {

			var divWidth = ((Math.random()*100) + 50).toFixed();
			var divHeight = divWidth / 2;
			var posX = (Math.random() * ($rectangle.width() - divWidth)).toFixed();
			var posY = (Math.random() * ($rectangle.height() - divHeight)).toFixed();
			
			var rectangle = new Rectangle(divWidth, divHeight, posX, posY)
			rectangle.setId(i);
			rectangle.draw();

			rectangles.push(rectangle);
		}
	}

	drawRectangles();

	function getDistance(a, b) {
		return Math.sqrt(Math.pow((a.x-b.x), 2) + Math.pow((a.y-b.y), 2));
	} 

	function calculateStats(rectangle, data) {
		if (!statsCache[rectangle.id]) {
			var initStats = { 
				currSpeed: 0,
				avgSpeed: 0, 
				distance: 0,
				pos: { 
					x: data.x, 
					y: data.y, 
					timestamp: new Date(data.timestamp)
				} 
			}
			statsCache[rectangle.id] = initStats;
		} else {
			var stats = statsCache[rectangle.id];

			var currTimestamp = new Date(data.timestamp);

			var prevPos = stats.pos;
			var elapsedTime =  currTimestamp - prevPos.timestamp;
			var currDistance = getDistance(data, prevPos);
			stats.currSpeed = currDistance / elapsedTime;
			
			stats.distance += currDistance;
			var totalElapsedTime = currTimestamp - appStartTime;
			stats.avgSpeed = stats.distance / totalElapsedTime;

			statsCache[rectangle.id] = stats;

			$("#li_" + rectangle.id).html('avg speed: ' + stats.avgSpeed + 'curr speed: ' + stats.currSpeed + ' distance: ' + stats.distance )
		}
	}

	$("#replay").click(function(e) {
		e.preventDefault();

		 $.ajax({
			url : "output",
			dataType: "text",
			success : function (resBody) {

				if (!resBody) return;

				var points = resBody.split(':');

				points.forEach(function(data) {

					var parts = data.split(',');

					var x = parts[0];
					var y = parts[1];

					if (!x || !y) return;
					drawTrail({ x: x, y: y }) // Not sure why it's not updating
						
				});
			}
		});
	});

	socket.on('mouseMoved', function(data) {
		drawTrail(data);

		rectangles.forEach(function(rectangle) {
			if (rectangle.contains(data.x, data.y)) {
				calculateStats(rectangle, data);
			}
		});
	});
});