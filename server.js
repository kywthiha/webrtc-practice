const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4:uuidV4} = require('uuid')
const rooms = {}
app.set('view engine','ejs')
app.use(express.static('public'))

app.get('/',(req,res)=>{
    res.redirect(`${uuidV4()}`)
})

app.get('/:room',(req,res)=>{
   
})

io.on('connection',socket=>{

   

})
server.listen(3800)