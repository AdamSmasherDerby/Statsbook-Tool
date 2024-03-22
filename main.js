const {app, BrowserWindow, Menu, dialog} = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain
const isDev = require('electron-is-dev')

let menu,
    win,
    helpWin,
    aboutWin,
    urlWin

let showConsole = false

if (isDev && !app.commandLine.hasSwitch('test')) {
    showConsole = true
} 

let createWindow = () => {
    win = new BrowserWindow({
        title: 'Statsbook Tool',
        width: 800, 
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file',
        slashes: true
    }))

    if (showConsole){
        win.webContents.openDevTools()
    }

    // Prevent files dropped outside of the drop zone from doing anything.
    win.webContents.on('will-navigate', (event) => event.preventDefault())

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
                {   label: 'Export Roster to CRG XML',
                    click: function() {
                        win.webContents.send('export-crg-roster')
                    },
                    enabled: false
                },
                {   label: 'Export Roster to CRG JSON (beta)',
                    click: function() {
                        win.webContents.send('export-crg-roster-json')
                    },
                    enabled: false
                },

                {   label: 'Save DerbyJSON',
                    click: function() {
                        win.webContents.send('save-derby-json')
                    },
                    enabled: false
                },
                {
                    label:'Exit',
                    accelerator:  'CmdOrCtrl+Q',
                    click(){
                        app.quit()
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'Copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectAll'
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

    // Do version check
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('do-version-check', app.getVersion())
    })
    
    win.webContents.on('new-window', function(e, url) {
        e.preventDefault()
        require('electron').shell.openExternal(url)
    })
}

let openAbout = () => {
    aboutWin = new BrowserWindow({
        parent: win,
        title: 'StatsBook Tool',
        icon: __dirname + '/build/flamingo-white.png',
        width: 300,
        height: 300,
        x: win.getPosition()[0] + 250,
        y: win.getPosition()[1] + 150,
        webPreferences: {
            nodeIntegration: true
        }
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
        y: win.getPosition()[1] + 20,
        webPreferences: {
            nodeIntegration: true
        }
    })

    if (showConsole){
        helpWin.webContents.openDevTools()
    }

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

let openURLwin = () => {
    urlWin = new BrowserWindow ({
        parent: win,
        title: 'Google Sheets URL Entry',
        icon: __dirname + '/build/flamingo-white.png',
        width: 800,
        height: 300,
        x: win.getPosition()[0] + 20,
        y: win.getPosition()[1] + 20,
        webPreferences: {
            nodeIntegration: true
        }
    })

    if (showConsole){
        urlWin.webContents.openDevTools()
    }

    urlWin.setMenu(null)

    urlWin.loadURL(url.format({
        pathname: path.join(__dirname, 'src/openurl.html'),
        protocol: 'file',
        slashes: true
    }))

    urlWin.webContents.on('new-window', function(e, url) {
        e.preventDefault()
        require('electron').shell.openExternal(url)
    })

    urlWin.on('closed', () => {
        aboutWin = null
    })

    urlWin.webContents.on('did-finish-load', () => {
        urlWin.webContents.send('set-version', app.getVersion())
    })
}

//app.on('ready', createWindow)

app.whenReady().then(() => createWindow())

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


ipc.on('enable-menu-items', () => {
    menu.items.find(x => x.label == 'File').submenu.items.find(x => x.label == 'Save DerbyJSON').enabled = true
    menu.items.find(x => x.label == 'File').submenu.items.find(x => x.label == 'Export Roster to CRG XML').enabled = true
    menu.items.find(x => x.label == 'File').submenu.items.find(x => x.label == 'Export Roster to CRG JSON (beta)').enabled = true
})

ipc.on('open-get-url-window', () => {
    openURLwin()
})

ipc.on('url-submitted', (event, statsbookURL) => {
    urlWin.close()
    win.webContents.send('load-google-sheet',statsbookURL)
})

ipc.on('error-thrown', (event, msg, url, lineNo, columnNo) => {
    dialog.showMessageBox(win, {
        type: 'error',
        title: 'Statsbook Tool',
        message: `Statsbook Tool has encountered an error.
        Here's some details:
        Message: ${msg}
        URL: ${url}
        Line Number: ${lineNo}
        Column Number: ${columnNo}
        Does this help?  It probably doesn't help.`
    })
})

process.on('uncaughtException', (err) => {
    dialog.showMessageBox(win, {
        type: 'error',
        title: 'Statsbook Tool',
        message: `Statsbook Tool has had an uncaught exception in main.js.  Does this help? (Note: will probably not help.) ${err}`
    })       
})
