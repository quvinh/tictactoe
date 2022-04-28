var socket = io();
var symbol;
const params = new URL(window.location.href);
console.log(params.searchParams.get("username"));
// const {username} = Qs.parse(location.search, {ignoreQueryPrefix: true});
$(function () {
  $("#namePlayer").text(`Player: ${params.searchParams.get("username")}`);
  $(".board button").attr("disabled", true);
  $(".board> button").on("click", makeMove);
  // Event is called when either player makes a move
  socket.on("move.made", function (data) {
    console.log(`username: ${params.searchParams.get("username")} - ${data.name}`);
    let log = '';
    params.searchParams.get("username") === data.name ? log = 'Bạn đã chọn' : log = `Player: ${data.name} đã chọn`;
    $("#log").text(log);
    // Render the move
    $("#" + data.position).text(data.symbol);
    data.symbol === "O" ? $("#" + data.position).attr("class", "btn btn-outline-danger") : $("#" + data.position).attr("class", "btn btn-outline-success");
    // If the symbol is the same as the player's symbol,
    // we can assume it is their turn

    myTurn = data.symbol !== symbol;

    // If the game is still going, show who's turn it is
    if (!isGameOver()) {
      if (gameTied()) {
        $("#log").text("");
        $("#messages").text("Game Drawn!");
        $("#messages").attr("class", "badge bg-success");
        $(".board button").attr("disabled", true);
      } else {
        renderTurnMessage();
      }
      // If the game is over
    } else {
      // Show the message for the loser
      if (myTurn) {
        $("#log").text("");
        $("#messages").text("Kết thúc. Thua rồi :))");
        $("#messages").attr("class", "badge bg-danger");
        // Show the message for the winner
      } else {
        $("#log").text("");
        $("#messages").text("WIN. Game dễ!");
        $("#messages").attr("class", "badge bg-success");
      }
      // Disable the board
      $(".board button").attr("disabled", true);
    }
  });

  // Set up the initial state when the game begins
  socket.on("game.begin", function (data) {
    // The server will asign X or O to the player
    symbol = data.symbol;
    console.log(symbol);
    console.log(data.id);
    // The first turn
    if(parseInt(Math.floor(Math.random() * 100))%2 === 0){
      myTurn = symbol === "X";
      renderTurnMessage();
    } else {
      myTurn = symbol === "O";
      renderTurnMessage();
    }
    
    socket.emit("get.username", params.searchParams.get("username"));
  });
  
  // let text = params.searchParams.get("username");
  // socket.on("got.username", function (data) {
  //   text += " vs " + data;
  //   console.log(`username: ${data}`);
  //   $("#namePlayer").text(text);
  // })
  // Disable the board if the opponent leaves
  socket.on("opponent.left", function () {
    $("#messages").text("Người chơi đã thoát.");
    $("#messages").attr("class", "badge bg-secondary");
    $(".board button").attr("disabled", true);
  });

  // socket.on("hey", (msg) => {
  //   console.log(msg);
  // })
});

function getBoardState() {
  var obj = {};
  // We will compose an object of all of the Xs and Ox
  // that are on the board
  $(".board button").each(function () {
    obj[$(this).attr("id")] = $(this).text() || "";
  });
  return obj;
}

function gameTied() {
  var state = getBoardState();

  if (
    state.a0 !== "" &&
    state.a1 !== "" &&
    state.a2 !== "" &&
    state.b0 !== "" &&
    state.b1 !== "" &&
    state.b2 !== "" &&
    state.b3 !== "" &&
    state.c0 !== "" &&
    state.c1 !== "" &&
    state.c2 !== ""
  ) {
    return true;
  }
}

function isGameOver() {
  var state = getBoardState(),
    // One of the rows must be equal to either of these
    // value for
    // the game to be over
    matches = ["XXX", "OOO"],
    // These are all of the possible combinations
    // that would win the game
    rows = [
      state.a0 + state.a1 + state.a2,
      state.b0 + state.b1 + state.b2,
      state.c0 + state.c1 + state.c2,
      state.a0 + state.b1 + state.c2,
      state.a2 + state.b1 + state.c0,
      state.a0 + state.b0 + state.c0,
      state.a1 + state.b1 + state.c1,
      state.a2 + state.b2 + state.c2,
    ];

  // to either 'XXX' or 'OOO'
  for (var i = 0; i < rows.length; i++) {
    if (rows[i] === matches[0] || rows[i] === matches[1]) {
      return true;
    }
  }
}

function renderTurnMessage() {
  // Disable the board if it is the opponents turn
  if (!myTurn) {
    $("#messages").text("Lượt của đối thủ");
    $("#messages").attr("class", "badge bg-secondary");
    $(".board button").attr("disabled", true);
    // Enable the board if it is your turn
  } else {
    $("#messages").text("Lượt của bạn");
    $("#messages").attr("class", "badge bg-warning");
    $(".board button").removeAttr("disabled");
  }
}

function makeMove(e) {
  e.preventDefault();
  // It's not your turn
  if (!myTurn) {
    return;
  }
  // The space is already checked
  if ($(this).text().length) {
    return;
  }

  // Emit the move to the server
  socket.emit("make.move", {
    symbol: symbol,
    position: $(this).attr("id"),
    name: params.searchParams.get("username"),
  });
}
