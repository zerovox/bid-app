var express = require('express')
var _ = require('underscore')
var app = express()

var players = _.shuffle([{name : "Tim"}, {name : "Quentin"}, {name : "Ben"}, {name : "Callum"}])
var playerNames = _.map(players, function(p){ return p.name })
var rooms = [{name : "1S", price : 250},{name : "1L", price : 250},{name : "2S", price : 250},{name : "2L", price : 250}]
var bidHistory = []
var round = 0
var disallowedToBid = []

function everything(player) {
	return {
		players: players,
		rooms: rooms,
		bidHistory: bidHistory.slice(0).reverse(),
		turn: turn(),
		player: player,
		round: round,
		disallowedToBid: disallowedToBid,
		allowedToBid: allowedToBid().sort().join(", "),
	}
}

_.each(players, function(player, i){
	player.room = rooms[i]
	rooms[i].occupant = player
})

function allowedToBid() {
	return _.without.apply(this, [playerNames].concat(disallowedToBid));
}

function playerAllowedToBid(playerName) {
	return disallowedToBid.indexOf(playerName) === -1;
}

function playerIdAllowedToBid(playerId) {
	return playerAllowedToBid(players[playerId].name);
}

function gameOver() {
	return disallowedToBid.length == 4;
}

function turn(){
	return round % players.length;
}

function date() {
	return new Date().toISOString()
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
		time: date(),
		room : room,
		price : room.price,
	})

	disallowedToBid = [player.name]

	moveRooms(player, room)
}

function pass(player){
	bidHistory.push({
		type : "pass",
		player : player,
		time: date(),
	})
	disallowedToBid.push(player.name)
}

app.engine('.jade', require('jade').__express)
app.set('view engine', 'jade')
app.set('views', __dirname + '/views')

app.get('/', function(req, res){
	res.render('select-user', {players: players})
})

app.get('/bid/:user', function(req,res){
	var playerId = req.params.user;
	var ev = everything(playerId)
	if(gameOver()){
		res.render('final', ev)
		return;
	}
	if(playerIdAllowedToBid(playerId)){
		res.render('your-turn', ev)
	} else {
		res.render('not-your-turn', ev)
	}
})

app.get('/bidUp/:user/:room/:round', function(req,res){
	var playerId = req.params.user;
	var room = req.params.room;
	if(playerIdAllowedToBid(playerId) && +req.params.round === round && room<rooms.length && room>=0){
		newBid(players[playerId], rooms[room])
		round += 1;
	}
	res.redirect("/bid/"+playerId)
})

app.get('/pass/:user/:round', function(req,res){
	var playerId = req.params.user;
	var room = req.params.room;
	if(playerIdAllowedToBid(playerId) && +req.params.round === round){
		pass(players[playerId])
		round += 1;
	}
	res.redirect("/bid/"+playerId)
})

app.get('/round', function(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write(round.toString())
	res.end()
})

app.listen(8080)