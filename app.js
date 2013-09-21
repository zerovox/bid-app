var express = require('express')
var _ = require('underscore')
var app = express()

var players = _.shuffle([{name : "Tim"}, {name : "Quentin"}, {name : "Ben"}, {name : "Callum"}])
var rooms = _.shuffle([{name : "1S", price : 250},{name : "1L", price : 250},{name : "2S", price : 250},{name : "2L", price : 250}])
var bidHistory = []
var t = 0
var passes = 0

_.each(players, function(player, i){
	player.room = rooms[i]
	rooms[i].occupant = player
})

function turn(){
	return t % players.length
}

function moveRooms(player, newRoom){
	var oldRoom = player.room
	var otherPlayer = newRoom.occupant

	player.room = newRoom
	newRoom.occupant = player

	otherPlayer.room = oldRoom
	oldRoom.occupant = otherPlayer
}

function newBid(player, room){
	_.each(rooms, function(room){
		room.price += -1
	})
	rooms[room].price += 4

	bidHistory.push({
		type : "bid",
		player : player,
		room : room,
		price : rooms[room].price
	})

	passes = 0

	moveRooms(player, room)
}

function pass(player){
	bidHistory.push({
		type : "pass",
		player : player
	})
	passes += 1
}

app.engine('.jade', require('jade').__express)
app.set('view engine', 'jade')
app.set('views', __dirname + '/views')

app.get('/', function(req, res){
	var options = ""
	_.each(players, function(player, index){
		options += '<a href="bid/'+index+'">'+player.name+'</a><br />'
	})
	res.send('Who are you?<br />'+options)
})

app.get('/bid/:user', function(req,res){
	var player = req.params.user;
	if(passes > 2){

		return res.send()
	} 
	if(turn() == player){
		var bidOptions = "It's your turn.<br /><ul>"
		_.each(rooms, function(room, index){
			bidOptions += '<li><a href="/bidUp/'+player+'/'+index+'">'+room.name+' : $'+room.price+' -> $'+(room.price+3)+'</a></li>'
		})
		bidOptions += "</ul>"
		res.send(bidOptions)
	} else {
		res.render('bid', {})
	}
})

app.get('/bidUp/:user/:room', function(req,res){
	var player = req.params.user;
	var room = req.params.room;
	if(player == turn()){
		if(room>=rooms.length){
			pass(player)
		} else {
			newBid(player, room)
		}
		t += 1;
	}

	res.redirect("/bid/"+player)

})

app.listen(8080)