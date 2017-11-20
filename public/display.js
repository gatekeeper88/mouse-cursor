$( document ).ready(function() {
	var socket = io();
	var $rectangle = $("#rectDiv")
	var rectBox = $rectangle.get(0).getBoundingClientRect();
	var lastPosition;
	

	function getRandomColor() {
		return '#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
	}

	function Rectangle (w, h, x, y) {
		this.x = Number(x);
		this.y = Number(y);
		this.width = Number(w);
		this.height = Number(h);

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

	function showStats() {
		rectangles.forEach(function(rect) {
			var stats = updateSpeedStats(rect);
			$("#li_" + rect.id).html(rect.id + ' avg speed: ' + stats.avgSpeed + 'curr speed: ' + stats.currSpeed )
		});
	}

	drawRectangles();
	showStats();

	function getDistance(a, b) {
		return Math.sqrt(Math.pow((a.x-b.x), 2) + Math.pow((a.y-b.y), 2));
	} 

	function updateSpeedStats(rectangle, position) {
		var initStats = {
			currSpeed: 0,
			avgSpeed: 0,
			sumSpeed: 0,
			speedCount: 0
		}

		if (!position)
			return initStats;

		if (!statsCache[rectangle.id]) {
			
			statsCache[rectangle.id] = initStats;

			return initStats;
		} else {
			var stats = statsCache[rectangle.id];

			var currTimestamp = new Date(position.timestamp);
			var lastTimestamp = new Date(lastPosition.timestamp);


			// Calculate current speed
			var elapsedTime =  (currTimestamp - lastTimestamp) / 1000;

			var currDistance = getDistance(position, lastPosition);

			var currSpeed = currDistance / elapsedTime;
			stats.currSpeed = currSpeed;


			if ( currSpeed > 0 ) {
				stats.speedCount = stats.speedCount + 1;
				stats.sumSpeed += currSpeed;
			}

			// Calculate average speed
			if ( stats.speedCount > 0 ) {
				stats.avgSpeed = stats.sumSpeed / stats.speedCount;
			}

			statsCache[rectangle.id] = stats;

			return stats;
		}
	}

	function getSpeedStats(id) {
		return statsCache[id];
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

	socket.on('mouseMoved', function(position) {
		drawTrail(position);
			if (!lastPosition) {
				lastPosition = position;

				return;
			}

			rectangles.forEach(function(rectangle) {
				if (rectangle.contains(position.x, position.y)) {

					var stats = updateSpeedStats(rectangle, position);
					var currSpeed = stats.currSpeed;
					var avgSpeed = stats.avgSpeed;

					$("#li_" + rectangle.id).html(rectangle.id + ' avg speed: ' + stats.avgSpeed + 'curr speed: ' + stats.currSpeed )
				} else {
					var stats = getSpeedStats(rectangle.id);
					
					if (!stats) return;

					var avgSpeed = stats.avgSpeed;
					var currSpeed = 0;
					$("#li_" + rectangle.id).html(rectangle.id + ' avg speed: ' + stats.avgSpeed + 'curr speed: ' + currSpeed )
				}
			});

			lastPosition = position;
	});
});