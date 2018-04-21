const {app, BrowserWindow, Menu, dialog} = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain

let menu,
    win,
    helpWin

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

    if (isDev()){
        win.webContents.openDevTools()
    }

    win.on('closed', ()=> {
        win=null
    })

    menu = Menu.buildFromTemplate([
        {
            label: 'Options',
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
                {   label: 'About',
                    click: function(){
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Statsbook Tool',
                            message: (`Statsbook Tool Version: ${app.getVersion()}\n` +
                                'by: Adam Smasher (Daniel Alt)\n' +
                                'https://github.com/AdamSmasherDerby/Statsbook-Tool/releases/' 
                            )
                        })
                    }
                }
            ]    
        }
    ])
    Menu.setApplicationMenu(menu)
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

let isDev = () => {
    return process.mainModule.filename.indexOf('app.asar') === -1
}

ipc.on('enable-save-derby-json', () => {
    menu.items[0].submenu.items[0].enabled = true
})