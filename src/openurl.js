const electron = require('electron')
const ipc = electron.ipcRenderer

let submitURLbutton = document.getElementById('submitURLbutton')
let urlBox = document.getElementById('urlBox')

submitURLbutton.onclick = () => {
    ipc.send('url-submitted',urlBox.value)
}

// Submit URL if user hits "Enter"
urlBox.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault()
        submitURLbutton.click()
    }
})