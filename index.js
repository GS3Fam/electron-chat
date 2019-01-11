const electron = require('electron');
const url = require('url');
const path = require('path');
const net = require('net');
const mongoose = require('mongoose');

mongoose.connect("mongodb://jairo_form_3:6sa5asdas6da5s7da89fdgdf@ds161487.mlab.com:61487/form_reader_3", {useNewUrlParser: true})

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;

// Listener
app.on('ready', function(){
    // Create new window
    mainWindow = new BrowserWindow({});
    // Load html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'view', 'index.html'),
        protocol: 'file',
        slashes: true
    }));
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    mainWindow.on('closed', function(){
        mainWindow = null
    })
    // open dev tools
    mainWindow.webContents.openDevTools()

    /* Instance socket on create window */
    var io = require('socket.io').listen(80);
    
    let ChatRoom = require('./models/chatroom'),
	    User = require('./models/user'),
        connections = [],
	    typing = []

    io.sockets.on('connection', function(socket){
        connections.push(socket);
        console.log(`!-- con: ${connections.length} sockets connected`);

        // Disconnect
        socket.on('disconnect', function(data){
            connections.splice(connections.indexOf(socket), 1);
            console.log(`!-- dc: ${connections.length} sockets connected`)
        })

        // Send Message
        socket.on('mess:send', (data)=>{
            io.sockets.to(data.room).emit('mess:new', {
                msg: data.mess ,
                user: data.name,
                userid: data.id
            });
        })

        // Room
        socket.on('room', function(room) {
            socket.join(room);
        });

        // Room List
        socket.on('roomlist', function(data) {
            let thisUser, userList, {userid, search} = data;

            User.find({_id: userid})
                .then( user =>{
                    thisUser = user[0]
                    return User.find({companyCode: thisUser.companyCode, _id: {$ne: userid} });
                })
                .then( users =>{
                    userList = users
                    return ChatRoom.find({
                        $or: [
                            {organization: thisUser.companyCode},
                            {members: {$all: [userid]}}
                        ]
                    });
                })
                .then( rooms =>{
                    let roomlist = rooms.reduce((temp, room)=>{
                        room.type == 'private' ?
                            room.name = userList.reduce((usertemp, user)=>{
                                return room.members.indexOf(user._id) > -1 ? user.username : usertemp;
                            },room.name) : 0

                        room.name.toLowerCase().search(search.toLowerCase()) > -1 ? temp.push(room) : 0
                        return temp;
                    },[])
                    socket.emit('roomlist', roomlist);
                })
        });

        // People List Group
        socket.on('people-list', function(data) {
            let
                thisUser, userList, exclude,
                {userid, search} = data;

            if(data.exclude[0]){
                exclude = data.exclude
                exclude.push(userid)
            }
            else exclude = [userid]

            User.find({_id: userid})
                .then( user =>{
                    thisUser = user[0]
                    let query = {companyCode: thisUser.companyCode, _id: {$nin: exclude}}
                    search ? query.username = {$regex: new RegExp(search, "i")} : 0
                    return User.find(query);
                })
                .then( users =>{
                    userList = users
                    socket.emit('people-list', userList);
                })
        })

        // Typing
        socket.on('is-typing', function(data) {
            let	{userid, username, room, status} = data;

            // matching
            if(status){
                typing.reduce((temp, data)=>{
                    return data.userid == userid && data.room == room ? 1 : temp
                },0) ? 0 : typing.push({userid: userid, username: username, room: room})
            }
            else{
                typing.forEach((data, i)=>{
                    data.userid == userid && data.room == room ? typing.splice(i,1) : 0
                })
            }

            let room_typing = typing.reduce((temp, data)=>{
                data.room == room ? temp.push(data) : 0
                return temp
            },[])

            io.sockets.to(room).emit('typing', room_typing);
        })

        // Group Room Rename
        socket.on('group:rename', function(data) {
            let {room, name} = data;

            ChatRoom.find({_id: room}).exec((err,chatroom) =>{
                if(chatroom[0]){
                    chatroom[0].organization == "0" ?
                        ChatRoom.findOneAndUpdate({_id: room}, {name: name}, {upsert:false}, function(err, doc){
                            io.sockets.to(room).emit('group:rename', name);
                        })
                        : io.sockets.to(room).emit('group:rename', chatroom[0].name);
                }
                else io.sockets.to(room).emit('group:rename', null);

            })
        })
    })
    // io.on('connection', (socket) => {
    //     console.log('New user connected');

    //     //default username
    //     socket.username = 'Anonymous';

    //     //Listen on change_username
    //     socket.on('change_username', (data) => {
    //         socket.username = data.username;
    //     })

    //     //listen on new message
    //     socket.on('new_message', (data) => {
    //         io.sockets.emit('new_message',  {message : data.message, username : socket.username});
    //     })

    //     // listen on typing
    //     socket.on('typing', (data) => {
    //         socket.broadcast.emit('typing', {username : socket.username})
    //     })

    //     //listen on remove typing
    //     socket.on('remove-typing', (data) => {
    //         socket.broadcast.emit('remove-typing', {username : socket.username})
    //     })
    // })
});

// Create menu template
const menuTemplate = [
    {
        label: 'Chat',
        click(){
            mainWindow.send('open:chat', 'hello')
        }
    },
    {
        label: 'Dev Tools',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    }
]