var express = require('express');
var http = require('http');
var path = require('path');
var http = require('http');
var fs = require('fs');
var app = express();

var filePath = './public/output';

// Setup Express
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));

// Start Express
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Start Socket.io
var io = require('socket.io').listen(server);

if (fs.existsSync(filePath)) {
	fs.unlinkSync(filePath);
}
var fileStream = fs.createWriteStream(filePath);

// On connection...
io.on('connection', function(socket){
	var clients = io.sockets.clients();

	// listen for mouse updates from client
	socket.on('mouse', function (data) {
		// Write data to file
		fileStream.write(data.x + ',' + data.y + ',' + new Date(data.timestamp).getTime() + ':');
		// Broadcast to connected clients
		socket.broadcast.emit('mouseMoved', data);
	});

	//On disconnect
	socket.on('disconnect', function() {
		console.log('Got disconnected');
   });
});


