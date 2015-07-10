var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var room = require('./room')

app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res){
  res.sendfile('./views/index.html');
});

app.get('/client', function(req, res){
  res.sendfile('./views/controller.html');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  setTimeout(function(){
  	socket.emit('current queue', room.getQueue());
  }, 1000);

  socket.on('get top of queue', function(){
  	socket.emit('current queue', room.getQueue());
  	socket.emit('new top of queue', room.getQueue()[0]);
  });

  socket.on('pop top of queue', function(song){
    if(song.id === room.getQueue()[0]){
      room.removeTopSongFromQueue();
    }
  	socket.emit('current queue', room.getQueue());
  	socket.broadcast.emit('new top of queue', room.getQueue()[0]);
  });

  socket.on('delete song by id', function(id){
  	var pl = room.getQueue();
  	var i = pl.indexOf(id);
  	room.deleteSong(i);
  	socket.emit('current queue', room.getQueue());
  	if(i === 0){  	
  		socket.emit('new top of queue', room.getQueue()[0]);
  	}
  });

  socket.on('add song', function(newId){
  	room.addSongToQueue(newId);
  	socket.emit('current queue', room.getQueue());
  	if(room.getQueue().length === 1) socket.emit('new top of queue', room.getQueue()[0]);
  });

  socket.on('bring to front', function(id){
  	var pl = room.getQueue();
  	var i = pl.indexOf(id);

  	room.moveSong(i, 1)
  	socket.emit('current queue', room.getQueue());
  });

  socket.on('push to back', function(id){
  	var pl = room.getQueue();
  	var i = pl.indexOf(id);
  	room.deleteSong(i);
  	room.addSongToQueue(id);
  	socket.emit('current queue', room.getQueue());
  	if(i === 0) socket.emit('new top of queue', room.getQueue()[0]);
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});




