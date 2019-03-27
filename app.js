var express = require('express')
var app = express()
var PORT = process.env.PORT || 5000
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)

var users = []

server.listen(PORT, function(){
    console.log("Server Listening on port ", PORT)
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html')
})

io.sockets.on('connection', function(socket){
    socket.on('new user', function(data, callback){
        if(data in users){
            callback(false)
        } else {
            callback(true)
            socket.nickname = data
            users[socket.nickname] = socket
            updateNicknames()
        }
    })

    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users))
    }

    socket.on('send message', function(data, callback){
        var msg = data.trim()
        if(msg.substr(0,3) === '/w '){
            msg = msg.substr(3)
            var index = msg.indexOf(' ')
            if(index !== -1){
                var name = msg.substring(0, index)
                var msg = msg.substring(index + 1)
                if(name in users) {
                    users[name].emit('private', {msg: msg, nick: socket.nickname})
                } else {
                    callback('Error! Enter a valid user.')
                }
            } else {
                callback('Error! Please enter a message for your private message.')
            }
        } else {
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname})
        }
    })

    socket.on('disconnect', function(data) {
        if(!socket.nickname) return;
        delete users[socket.nickname]
        updateNicknames()
    })
})