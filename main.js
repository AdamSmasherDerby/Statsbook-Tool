const {app, BrowserWindow, Menu, dialog} = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain
const isDev = require('electron-is-dev')
require('update-electron-app')()

let menu,
    win,
    helpWin,
    aboutWin

let createWindow = () => {
    win = new BrowserWindow({
        title: 'Statsbook Tool',
        icon: __dirname + '/build/flamingo-white.png',
        width: 800, 
        height: 600
    })

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file',
        slashes: true
    }))

    if (isDev){
        win.webContents.openDevTools()
        require('devtron').install()
    }

    win.on('closed', ()=> {
        win=null
    })

    win.webContents.on('crashed', ()=> {
        dialog.showMessageBox(win, {
            type: 'error',
            title: 'Statsbook Tool',
            message: 'Statsbook Tool has crashed.  This should probably not surprise you.'
        })
    })

    win.on('unresponsive', ()=> {
        dialog.showMessageBox(win, {
            type: 'error',
            title: 'Statsbook Tool',
            message: 'Statsbook Tool has become unresponsive.  You should probably have been more emotionally supportive.'
        })
    })

    menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {   label: 'Save DerbyJSON',
                    click: function() {
                        win.webContents.send('save-derby-json')
                    },
                    enabled: false
                },
                {
                    label:'Exit',
                    click(){
                        app.quit()
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Error Descriptions',
                    click: function(){
                        openHelp()
                    }
                },
                {
                    label: 'About',
                    click: function(){
                        openAbout()
                    }
                },
            ]    
        }
    ])
    Menu.setApplicationMenu(menu)
}

let openAbout = () => {
    aboutWin = new BrowserWindow({
        parent: win,
        title: 'StatsBook Tool',
        icon: __dirname + '/build/flamingo-white.png',
        width: 300,
        height: 300,
        x: win.getPosition()[0] + 250,
        y: win.getPosition()[1] + 150
    })

    aboutWin.setMenu(null)

    aboutWin.loadURL(url.format({
        pathname: path.join(__dirname, 'src/aboutst.html'),
        protocol: 'file',
        slashes: true
    }))

    aboutWin.webContents.on('new-window', function(e, url) {
        e.preventDefault()
        require('electron').shell.openExternal(url)
    })

    aboutWin.on('closed', () => {
        aboutWin = null
    })

    aboutWin.webContents.on('did-finish-load', () => {
        aboutWin.webContents.send('set-version', app.getVersion())
    })
    
}

let openHelp = () => {
    helpWin = new BrowserWindow({
        parent: win,
        title: 'Error Descriptions',
        icon: __dirname + '/build/flamingo-white.png',
        width: 800,
        height: 600,
        x: win.getPosition()[0] + 20,
        y: win.getPosition()[1] + 20
    })

    helpWin.loadURL(url.format({
        pathname: path.join(__dirname, 'src/help.html'),
        protocol: 'file',
        slashes: true
    }))

    helpWin.setMenu(null)

    helpWin.on('closed', () => {
        helpWin = null
    })
    
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate',() => {
    if (win == null){
        createWindow()
    }
})

ipc.on('enable-save-derby-json', () => {
    menu.items[0].submenu.items[0].enabled = true
})

process.on('uncaughtException', (err) => {
    dialog.showMessageBox(win, {
        type: 'error',
        title: 'Statsbook Tool',
        message: `Statsbook Tool has had an uncaught exception.  Does this help? (Note: will probably not help.) ${err}`
    })       
})