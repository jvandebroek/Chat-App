const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { addUser, removeUser,  getUser,  getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket)=>{

    socket.on('join', ({username, room}, callback) =>{
        const {error, user} = addUser({id: socket.id, username, room})

        if(error){
            return callback(error)
        }

        socket.join(user.room) //new option created to emit to just this room

        socket.emit('message', generateMessage('Welcome!', user.room))//<- only current user

        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined the room`, user.room))//<- all connections EXCEPT current user
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback)=>{
        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(message)){
            return callback('profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(message, user.username)) //<- all connections
        callback()
    })


    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`, user.room))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (position, callback)=>{
        const user = getUser(socket.id)
        io.emit('locationMessage', generateMessage(`https://google.com/maps?q=${position.lat},${position.long}`, user.username))
        callback()
    })


})



server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})

//count app:
// let count = 0

// io.on('connection', (socket)=>{
//     console.log('new connection')

//     socket.emit('countUpdated', count)

//     socket.on('increment', ()=>{
//         count++
//         //socket.emit('countUpdated', count) <- One connection
//         io.emit('countUpdated', count) //<- all connections
//     })
// })