let versionText = document.getElementById('version')
const electron = require('electron')
const ipc = electron.ipcRenderer

ipc.on('set-version', (event, version) => {
    versionText.innerHTML = version
})
