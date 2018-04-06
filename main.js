const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain

function createWindow(){
    win = new BrowserWindow({width: 800, height: 600})

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file',
        slashes: true
    }))

    win.webContents.openDevTools()

    win.on('closed', ()=> {
        win=null
    })

    var menu = Menu.buildFromTemplate([
        {
            label: 'Options',
                submenu: [
                {
                    label:'Exit',
                    click(){
                        app.quit()
                }}
            ]
        }
    ])
    Menu.setApplicationMenu(menu);
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
