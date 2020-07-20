const Application = require('spectron').Application
const assert = require('assert')
const electronPath = require('electron')
const path = require('path')

const app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..'), '--test'],
})

const testSheetName = 'TestSheet.xlsx'
const testFile = path.join(__dirname, testSheetName)

describe('Statsbook Tool', function () {
    this.timeout(10000)

    beforeEach( () => {
        return app.start()
    })

    afterEach( () => {
        if (app && app.isRunning()) {
            return app.stop()
        }
    })

    /*it('shows an initial window', async() => {
        const count = await app.client.getWindowCount()
        return assert.equal(count, 1)
    })

    it('Shows correct window title', async () => {
        const title = await app.client.getTitle()
        return assert.equal(title, 'StatsBook Tool')
    })*/

    it('Loads a file and displays the filename', async () => {
        const remoteFilePath = await app.client.uploadFile(testFile)
        let inputBox = await app.client.$('#file-select')
        await inputBox.setValue(remoteFilePath)
        let val = await (await app.client.$('#loadedFile')).getText()
        console.log(val)
        return assert.equal(val, testSheetName)
    })
})