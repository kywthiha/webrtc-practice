const express = require('express')
const cors = require('cors');
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server,
    {
        cors: {
            origin: "http://127.0.0.1:5500",
            methods: ["GET", "POST"]
        }
    })

let users = [

]

app.use(cors())

app.get('/users', (req, res) => {
    res.json(users);
})

io.on('connection', socket => {

    socket.on('signal', (data) => {
        console.log(data)
        socket.to(data.conversation.otherUser.id).emit("signal", data);
       
    })

    socket.on('join-user', (user) => {
        console.log(user)
        users.push(user)
        socket.join('join-user')
        socket.to('join-user').emit('user-connected', user)

    })

    socket.on('disconnect', () => {
        const user = users.filter(item=>item.id===socket.id)
        socket.join('join-user')
        socket.to('join-user').emit('user-disconnect', user)
        users = users.filter(item => item.id !== socket.id)
    })

})
server.listen(3800)