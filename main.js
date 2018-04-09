const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain

let menu

createWindow = () => {
    win = new BrowserWindow({width: 800, height: 600})

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

isDev = () => {
    return process.mainModule.filename.indexOf('app.asar') === -1;
  }

ipc.on('enable-save-derby-json', (event) => {
    menu.items[0].submenu.items[0].enabled = true
})