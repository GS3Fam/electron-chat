const electron = require('electron');
const url = require('url');
const path = require('path');
const net = require('net');

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
    
    io.on('connection', (socket) => {
        console.log('New user connected');

        //default username
        socket.username = 'Anonymous';

        //Listen on change_username
        socket.on('change_username', (data) => {
            socket.username = data.username;
        })

        //listen on new message
        socket.on('new_message', (data) => {
            socket.emit('new_message', {message : data.message, username : socket.username});
        })

        // listen on typing
        socket.on('typing', (data) => {
            socket.broadcast.emit('typing', {username : socket.username})
        })

        //listen on remove typing
        socket.on('remove-typing', (data) => {
            socket.broadcast.emit('remove-typing', {username : socket.username})
        })
    })
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