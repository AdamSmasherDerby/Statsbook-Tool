//const Application = require('spectron').Application
const spectronMenuAddon = require('spectron-menu-addon')
const menuAddon = new spectronMenuAddon.SpectronMenuAddon()
const electronPath = require('electron')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.should()
chai.use(chaiAsPromised)
const _ = require('lodash')

/*const app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..'), '--test'],
})*/

const app = menuAddon.createApplication({
    path: electronPath,
    args: [path.join(__dirname, '..'), '--test'],
})

const testSheetName = 'TestSheet.xlsx'
const testFile = path.join(__dirname, testSheetName)

const cleanTestSheetName = 'CleanTestSheet.xlsx'
const cleanTestFile = path.join(__dirname, cleanTestSheetName)

const errorList = require('../assets/sberrors.json')

describe('Basic Program Functions Without File Load', function () {
    this.timeout(10000)

    before( () => {
        return app.start()
    })

    after( () => {
        if (app && app.isRunning()) {
            return app.stop()
        }
    })

    it('shows an initial window', () => {
        return app.client.getWindowCount().should.eventually.equal(1)
    })

    it('Shows correct window title', async () => {
        return app.client.getTitle().should.eventually.equal('StatsBook Tool')
    })

    describe('Tests on about window', function () {
        this.timeout(1000)

        before( async () => {
            await menuAddon.clickMenu('Help', 'About')
            await app.client.switchWindow('aboutst.html')
        })

        after( async () => {
            await app.client.windowByIndex(0)
        })

        it('tests about menu has opened', async () => {
            let URL = await app.webContents.getURL()
            return URL.should.include('aboutst.html')
        })

        it('tests version number exists in about menu', async () => {
            let version = await (await app.client.$('#version')).getText()
            return version.should.not.equal('')
        })

    })

    describe('Tests on error list window', function () {
        this.timeout(1000)

        before( async () => {
            await menuAddon.clickMenu('Help', 'Error Descriptions')
            await app.client.switchWindow('help.html')
        })

        after( async () => {
            await app.client.windowByIndex(0)
        })

        it('tests about menu has opened', async () => {
            let URL = await app.webContents.getURL()
            return URL.should.include('help.html')
        })

        it('tests table is not zero length', async () => {
            let val = await (await app.client.$$('#error-table > tr')).length
            return val.should.not.equal(0)
        })

    })

    describe('Tests on a clean Statsbook file', function () {
        this.timeout(1000)

        before( async () => {
            const remoteFilePath = await app.client.uploadFile(cleanTestFile)
            let inputBox = await app.client.$('#file-select')
            await inputBox.setValue(remoteFilePath)
            return
        })
    
        it('Loads the clean test file and verifies no positives', async () => {
            let val = await (await app.client.$('#output-box > table > tr > th')).getText()
            return val.should.equal('No Errors Found!')
        })

    })

    describe('Tests on a Statsbook with errors', function () {
        this.timeout(1000)

        // Before running tests, load statsBook with errors.
        before( async () => {
            const remoteFilePath = await app.client.uploadFile(testFile)
            let inputBox = await app.client.$('#file-select')
            await inputBox.setValue(remoteFilePath)
            return
        })
        
        // Check all of the scores errors exist
        for (let error in errorList.scores) {
            if(_.get(errorList, `penalties.${error}.noTest`, false)) continue
            it(`finds score error ${error}`, async () => {
                return app.client.$(`#${error}-header`).should.exist
            })   
        }

        // Check all of the penalties errors exist
        for (let error in errorList.penalties) {
            if (_.get(errorList, `penalties.${error}.noTest`, false)) continue
            it(`finds penalty error ${error}`, async () => {
                return app.client.$(`#${error}-header`).should.exist
            })
        }  

        // Check all lineups errors exist
        for (let error in errorList.lineups) {
            if (_.get(errorList, `lineups.${error}.noTest`, false)) continue
            it(`finds lineup error ${error}`, async () => {
                return app.client.$(`#${error}-header`).should.exist
            })
        }

        // Check all warnings exist
        for (let warning in errorList.warnings) {
            if (_.get(errorList, `warnings.${warning}.noTest`, false)) continue
            it(`finds warning ${warning}`, async () => {
                return app.client.$(`#${warning}-header`).should.exist
            })
        }

    })
})

