var express = require('express')
var app = express()
app.use(express.static('public'))
const port = process.env.PORT || 1234 //Thêm port để chạy trên localhost
var http = require('http').createServer(app);
var io = require('socket.io')(http);
// const params = new URL(window.location.href);
// const url = require('url')
// const {username} = Qs.parse(location.search, {ignoreQueryPrefix: true});
// const params = new URL(window.location.href);

http.listen(port)

app.get('/', function(req, res){
  res.sendFile(__dirname + '/game.html');
});
//them ten player
//random turn
//doi mau

var players = {},
  unmatched;


io.sockets.on("connection", function (socket) {
  console.log("socket connected")
  socket.emit('connect',{msg:"hello"})
  joinGame(socket);

  if (getOpponent(socket)) {
    socket.on("get.username", function(data) {
      console.log(`name: ${data}`)
      
      socket.emit("got.username", data);
      getOpponent(socket).emit("got.username", data);
    });

    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
      name: socket.id,
    });
    getOpponent(socket).emit("game.begin", {
      symbol: players[getOpponent(socket).id].symbol,
      id: socket.id,
    });
  }

  socket.on("make.move", function (data) {
    if (!getOpponent(socket)) {
      return;
    }
    socket.emit("move.made", data);
    getOpponent(socket).emit("move.made", data);
  });

  socket.on("disconnect", function () {
    if (getOpponent(socket)) {
      getOpponent(socket).emit("opponent.left");
    }
  });
});

function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched,

    symbol: "X",
    // The socket that is associated with this player
    socket: socket,
  };
  if (unmatched) {
    players[socket.id].symbol = "O";
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}

function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  // console.log(socket.id);
  return players[players[socket.id].opponent].socket;
}
