const socket = io()

document.getElementById('joinServer').addEventListener('click', function() {
  let name = document.getElementById('nameInput')
  if(!name.value){
    return log('Please enter a name')
  };
  socket.emit('joinLobby', name.value)
  //disable further events from this button
})

socket.on('resJoinLobby', function (data) {
  let nameNode = document.createTextNode(data)
  document.getElementsByClassName('title')[0].classList.add('hide')
  document.getElementById('userName').appendChild(nameNode)
})

socket.on('resUsers', function (users) {
  let gameList = document.getElementById('gameList')
  gameList.innerHTML = ''
  let thisUser = document.getElementById('userName').innerHTML
  for (var i = 0; i < users.length; i++) {
    if(users[i].name != thisUser){
      var liNode = document.createElement("LI")
      var game = document.createTextNode(users[i].name)
      liNode.appendChild(game)
      liNode.addEventListener('click', reqGame, false)
      gameList.appendChild(liNode)
    }
  }
})

function reqGame(e) {
  let player = e.target.innerHTML
  socket.emit('requestGame', player)
}

socket.on('message', function (message) {
  log(message)
})

function log(message) {
  let li = document.createElement('LI')
  li.appendChild(document.createTextNode(message))
  let gameMessages = document.getElementById('gameMessages')
  gameMessages.appendChild(li)
  gameMessages.scrollTop = gameMessages.scrollHeight
}

socket.on('challenge', function (challenge) {
  let lobby = document.getElementById('lobby')
  let accept = document.createElement('button')
  accept.id = 'accept'
  accept.innerHTML = "I'm Ready!"
  socket.challenge = challenge
  accept.addEventListener('click', function () {
    socket.emit('readyGame', socket.challenge)
  })
  lobby.insertBefore(accept,lobby.childNodes[1])

  log('Challenge from '+ challenge.challenger+'. Ready?')
})

socket.on('startGame', function (data) {
  let readyButton = document.getElementById('accept');
  if (readyButton) {
    readyButton.parentNode.removeChild(readyButton);
  }
  socket.game = data
  log('Game between '+data.playerOne+' and '+ data.playerTwo+'is on!' );
  startGame(data)
})

function startGame(data) {
  var canvas = document.createElement('canvas');
  canvas.id = 'canvas'
  canvas.width = 600
  canvas.height = 300

  document.getElementById('gameList').remove() //remove from Dom?
  document.getElementById('lobby').appendChild(canvas);
  gameRoutine(canvas, data)

}

function gameRoutine(board, gameData) {
  // console.log('socket.game: '+JSON.stringify(socket.game))
  let scores = document.createElement('div')
  scores.id = 'scores'
  scores.innerHTML =  socket.game.playerOne+': 0'+socket.game.playerTwo+': 0'
  document.getElementById('lobby').appendChild(scores)
  let ctx = board.getContext('2d')
 

  document.addEventListener('keydown', function(e){
        if (gameData.playerOneId == socket.id) {
             moveHandler(e, p1)
        }
        if (gameData.playerTwoId == socket.id) {
            moveHandler(e, p2)
        }
  }, false)

 let p1 = {colour:'#05EFFF',width: 10,height: 60, y: board.height/2, x: 10, dx: 0, dy: 0,name: 'P1 Rock', score: 0}
 let p2 = {colour: '#FFC300',width: 10,height: 60, y: board.height/2, x: board.width-20, dx: 0, dy: 0, name: 'P2', score: 0}
 let ball = {colour: '#CEFF33',width: 10,height: 10, y: board.height/2, x: board.width/2, dx: 2, dy: -2, name: 'Ball'};
 let drawId = setInterval(draw, 10)
// Render elements.
  function draw() {
    //redraw canvas first 
    ctx.clearRect(0, 0, 600, 300)
    drawBall()
    drawPaddle(p1)
    drawPaddle(p2)
    checkWin()
  }
  function checkWin(){
    if(p1.score<6 && p2.score<6){
      return 
    }
    let winner
    if (p1.score>5){
      winner = socket.game.playerOne
    } 
    if(p2.score>5) {
      winner = socket.game.playerTwo
    }
      clearInterval(drawId)
      drawScore(winner+' WON THE GAME')
      // ask if play again, if both say yes, run gameRountine, else return to lobby. 
  }
  function drawBall() {
      let diff = 5

      if(ball.x > board.width){
        p1.score++
        drawScore()
        ball.x = board.width/2
        ball.y = board.height/2
      }
      if(ball.x < 0){
        p2.score++
        drawScore()
        ball.x = board.width/2
        ball.y = board.height/2
      }

      if(ball.y > board.height || ball.y < 0){
        ball.dy = -ball.dy
      }

   
      if(ball.x+ball.width/2 > p1.x +p2.width
        && ball.x < p1.x+p1.width 
        && ball.y+ball.height>p1.y 
        && ball.y<p1.y+p1.height){
        ball.dx = -ball.dx;
        // console.log('ball: x'+ball.y + ' y'+ball.x)
        // console.log('p2.x:'+p1.x+' y: '+p1.y) 
      }

      if(ball.x+ball.width/2 > p2.x && ball.x < p2.x+p2.width && ball.y+ball.height>p2.y && ball.y<p2.y+p2.height){
        // console.log('ball: x'+ball.y + ' y'+ball.x)
        // console.log('p2.x:'+p2.x+' y: '+p2.y)  
        ball.dx = -ball.dx     
       }

      ball.y += ball.dy
      ball.x += ball.dx
      ctx.fillStyle = ball.colour;
      ctx.fillRect(ball.x, ball.y, ball.width, ball.height);    
  }

  function drawPaddle(paddle) {
    ctx.fillStyle = paddle.colour;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  }
  function drawScore(text) {
    let scoreStr
    if(text){
      scoreStr =  text
    }else{
      scoreStr = socket.game.playerOne+':' +p1.score +'  '+socket.game.playerTwo+':'+ p2.score
    }
    document.getElementById('scores').innerHTML = scoreStr
  }


  function moveHandler(press, player) {
     if(press.key=='x' || press.code == 'keyX'){
        player.y+= 20
         // console.log(press.key +'  '+JSON.stringify(player))
        // console.log(player+' pressed x')
     }
     if(press.key=='s' || press.code == 'keyS'){
        player.y-= 20 
        // console.log(press.key +'  '+JSON.stringify(player))
        // console.log(player+' pressed s')
   
     }
     if(player.y < 0){
        player.y = 0
     } 
     if(player.y + player.height > board.height){
        player.y = board.height - player.height
     }
     sendMove({id:gameData.id, movement: player.y})
     // get press.key and player
     // check what key was pressed
     // if w or s
     //    change code of that player shape
     //    redraw
     //    send to server

  }



  function sendMove(data) { 
    socket.emit('sendMove', data)
  }

  socket.on('getMove', function (opponent) {
    if (gameData.playerOneId == socket.id) {
      p2.y = opponent.movement
    }else{
      p1.y = opponent.movement
    }
  })

}
