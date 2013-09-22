var express = require('express')
var _ = require('underscore')
var app = express()

var players = _.shuffle([{name : "Tim"}, {name : "Quentin"}, {name : "Ben"}, {name : "Callum"}])
var rooms = [{name : "1S", price : 250},{name : "1L", price : 250},{name : "2S", price : 250},{name : "2L", price : 250}]
var bidHistory = []
var everything = function (player) {
	return {
		players: players,
		rooms: rooms,
		bidHistory: bidHistory,
		turn: turn(),
		player: player,
		round: round,
	}
}
var round = 0
var passes = 0

_.each(players, function(player, i){
	player.room = rooms[i]
	rooms[i].occupant = player
})

function turn(){
	return round % players.length
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
	room.price += 4

	bidHistory.push({
		type : "bid",
		player : player,
		room : room,
		price : room.price
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
	res.render('select-user', {players: players})
})

app.get('/bid/:user', function(req,res){
	var player = req.params.user;
	var ev = everything(player)
	if(passes > 2){
		res.render('final', ev)
		return;
	} 
	if(turn() == player){
		res.render('your-turn', ev)
	} else {
		res.render('not-your-turn', ev)
	}
})

app.get('/bidUp/:user/:room/:round', function(req,res){
	var player = req.params.user;
	var room = req.params.room;
	if(player == turn() && +req.params.round === round && room<rooms.length && room>=0){
		newBid(players[player], rooms[room])
		round += 1;
	}
	res.redirect("/bid/"+player)
})

app.get('/pass/:user/:round', function(req,res){
	var player = req.params.user;
	var room = req.params.room;
	if(player == turn() && +req.params.round === round){
		pass(players[player])
		round += 1;
	}
	res.redirect("/bid/"+player)
})

app.get('/round', function(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write(round.toString())
	res.end()
})

app.listen(8080)