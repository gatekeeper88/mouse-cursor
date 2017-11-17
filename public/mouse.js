$( document ).ready(function() {
	var mouseX, mouseY = 0;
	var refreshRate = 100;
	var $rectangle = $("#rectDiv")
	var rectBox = $rectangle.get(0).getBoundingClientRect();
	var socket = io();

	$(document).mousemove(function(event){
		mouseX = event.pageX;
		mouseY = event.pageY;
	});

	function getRandomColor() {
		return '#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
	}

	setInterval(function() {

		if (mouseX >= rectBox.left && mouseX <= rectBox.right &&
			mouseY >= rectBox.top && mouseY <= rectBox.bottom) {

			var pixelColor = getRandomColor();
			var $trail = $("<div></div>");

			$trail.css({
				position: 'absolute',
				top: mouseY,
				left: mouseX,
				'background-color': pixelColor
			});
			$trail.addClass('smallbox');
			$rectangle.append($trail);

			socket.emit('mouse', { x:  mouseX, y: mouseY, color: pixelColor, timestamp: new Date() });
		}
	}, refreshRate);
});