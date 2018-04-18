const electron = require('electron')
const ipc = electron.ipcRenderer
const XLSX = require('xlsx')
const moment = require('moment')

// Page Elements
let holder = document.getElementById('drag-file')
let fileSelect = document.getElementById('file-select')
let fileInfoBox = document.getElementById('file-info-box')
let outBox = document.getElementById('output-box')

// Template Files
let template2018 = require('../assets/2018statsbook.json')
let template2017 = require('../assets/2017statsbook.json')
let sbErrorTemplate = require('../assets/sberrors.json')
// TO DO - Make template dynamically choosable

// Globals
let sbData = {},  // derbyJSON formatted statsbook data
    sbTemplate = {},
    sbErrors = {},
    penalties = {},
    starPasses = [],
    teamList = ['home','away'],
    sbFilename = '',
    sbVersion = '',
    rABS = true // read XLSX files as binary strings vs. array buffers
    // Good practice - sbData should probably become a class and the 
    // various "read" routines become methods.

ipc.on('save-derby-json', () => {
    // Saves statsbook data to a JSON file
    
    var data = encode( JSON.stringify(sbData, null, ' ')) 

    var blob = new Blob( [ data ], {
        type: 'application/octet-stream'
    })
    
    let url = URL.createObjectURL( blob )
    var link = document.createElement( 'a' )
    link.setAttribute( 'href', url )
    link.setAttribute( 'download', sbFilename.split('.')[0] + '.json')
    
    let e = document.createEvent( 'MouseEvents' )
    e.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    link.dispatchEvent( e )
})

let makeReader = (sbFile) => {
    // Create reader object and load statsbook file
    let reader = new FileReader()
    sbFilename = sbFile.name

    reader.onload = (e) => {
        readSbData(e)
    }

    // Actually load the file
    if (rABS) {
        reader.readAsBinaryString(sbFile)
    }
    else {
        reader.readAsArrayBuffer(sbFile)
    }
}

fileSelect.onchange = (e) => {
    if (e.target.value == undefined){
        return false
    }
    e.preventDefault()
    e.stopPropagation

    if (e.target.files.length > 1){
        fileInfoBox.innerHTML = 'Error: Multiple Files Selected.'
        return false
    } 
    
    let sbFile = e.target.files[0]

    makeReader(sbFile)
    return false
}

holder.ondragover = () => {
    holder.classList.add('box__ondragover')
    return false
}

holder.ondragleave = () => {
    holder.classList.remove('box__ondragover')
    return false
}

holder.ondragend = () => {
    return false
}

holder.ondrop = (e) => {
    holder.classList.remove('box__ondragover')
    e.preventDefault()
    e.stopPropagation

    if (e.dataTransfer.files.length > 1){
        fileInfoBox.innerHTML = 'Error: Multiple Files Selected.'
        return false
    } 
    
    let sbFile = e.dataTransfer.files[0]

    makeReader(sbFile)
    return false

}

let readSbData = (e) => {
    // Read in the statsbook data for an event e
    let data = e.target.result
    if (!rABS) data = new Uint8Array(data)
    var workbook = XLSX.read(data, {type: rABS ? 'binary' :'array'})

    //Read in information from the statsbook
    sbData = {}        
    sbErrors = JSON.parse(JSON.stringify(sbErrorTemplate))
    penalties = {}
    starPasses = []
    getVersion(workbook)
    readIGRF(workbook)
    for (var i in teamList){
        readTeam(workbook, teamList[i])
    }
    updateFileInfo()
    readOfficials(workbook)
    sbData.periods = {'1': {jams: []}, '2': {jams: []}}
    readScores(workbook)
    readPenalties(workbook)
    readLineups(workbook)
    errorCheck()

    // Display Error List
    //outBox.innerHTML += JSON.stringify(sbErrors,null,' ')
    if(outBox.lastElementChild){
        outBox.removeChild(outBox.lastElementChild)
    }
    outBox.appendChild(sbErrorsToTable())
    ipc.send('enable-save-derby-json')
}

let getVersion = (workbook) => {
    // Determine version of Statsbook file.

    let versionText = cellValue(workbook, [0, 'A3'])
    let versionRe = /(\d){4}/
    sbVersion = versionRe.exec(versionText)[0]

    switch (sbVersion){
    case '2018':
        sbTemplate = template2018
        break
    case '2017':
        sbTemplate = template2017
        break
    default:
        sbTemplate = {}
    }

}

let readIGRF = (workbook) => {
    // read IGRF data into the sbData file

    let getJsDateFromExcel = (excelDate) => {
        // Helper function to convert Excel date to JS format
        return new Date((excelDate - (25567 + 1))*86400*1000)
    }
    
    let getJsTimeFromExcel = (excelTime) => {
        // Helper function to convert Excel time to JS format
        let secondsAfterMid = excelTime * 86400
        let hours = Math.floor(secondsAfterMid/3600)
        let remainder = secondsAfterMid % 3600
        let minutes = Math.floor(remainder/60)
        let seconds = remainder % 60
        return(`${hours.toString().padStart(2,'0')
        }:${minutes.toString().padStart(2,'0')
        }:${seconds.toString().padStart(2,'0')}`)
    }

    sbData.venue = {}
    sbData.venue.name = cellValue(workbook,sbTemplate.venue.name)
    sbData.venue.city = cellValue(workbook,sbTemplate.venue.city)
    sbData.venue.state = cellValue(workbook,sbTemplate.venue.state)
    sbData.date = getJsDateFromExcel(cellValue(workbook,sbTemplate.date))
    sbData.time = getJsTimeFromExcel(cellValue(workbook,sbTemplate.time))
    sbData.tournament = cellValue(workbook,sbTemplate.tournament)
    sbData['host-league'] = cellValue(workbook,sbTemplate['host-league'])

}

let readTeam = (workbook,team) => {
    // team should be "home" or "away"
    let name_address = {},
        num_address = {},
        skaterName = '',
        skaterNumber = '',
        skaterData = {}

    // Extract general team data
    if (!sbData.hasOwnProperty('teams')){sbData.teams = {}}
    sbData.teams[team] = {}
    sbData.teams[team].league = cellValue(workbook,sbTemplate.teams[team].league)
    sbData.teams[team].name = cellValue(workbook,sbTemplate.teams[team].name)
    sbData.teams[team].color = cellValue(workbook,sbTemplate.teams[team].color)

    // Extract skater data
    let [nameSheet, nameRow, nameCol] 
        = nameRowCol(workbook, sbTemplate.teams[team].firstName)
    let [numSheet, numberRow, numberCol] 
        = nameRowCol(workbook, sbTemplate.teams[team].firstNumber)
    let maxNum = sbTemplate.teams[team].maxNum
    sbData.teams[team].persons=[]

    for (var i = 0; i<maxNum; i++) {
        // For each skater, read in name and number, add to sbData
        name_address = { c: nameCol, r: nameRow + i}
        num_address = { c: numberCol, r: numberRow + i}
        skaterName = nameSheet[XLSX.utils.encode_cell(name_address)]
        skaterNumber = numSheet[XLSX.utils.encode_cell(num_address)]
        if (skaterNumber == undefined || skaterNumber.v == undefined) {continue}
        skaterData = {name: (skaterName.v || ''), number: skaterNumber.v}
        sbData.teams[team].persons.push(skaterData)
        penalties[team + ':' + skaterNumber.v] = []
    }


}

let readOfficials = (workbook) => {
    // Read in officials' data

    let props = ['firstName','firstRole','firstLeague','firstCert'],
        sheet = getSheet(workbook, sbTemplate.teams.officials.sheetNumber),
        maxNum = sbTemplate.teams.officials.maxNum,
        nameAddress = {},
        roleAddress = {},
        leagueAddress = {},
        certAddress = {}

    sbData.teams.officials = {}
    sbData.teams.officials.persons=[]

    let cells = {}
    for (i in props){
        cells[props[i]] = XLSX.utils.decode_cell(
            sbTemplate.teams.officials[props[i]]
        )
    }

    nameAddress.c = cells.firstName.c
    roleAddress.c = cells.firstRole.c
    leagueAddress.c = cells.firstLeague.c
    certAddress.c = cells.firstCert.c

    for (var i = 0; i<maxNum; i++) {
        nameAddress.r = cells.firstName.r + i
        roleAddress.r = cells.firstRole.r + i
        leagueAddress.r = cells.firstLeague.r + i
        certAddress.r = cells.firstCert.r + i

        // Require presence of both a name and a role to record a line:
        let offName = sheet[XLSX.utils.encode_cell(nameAddress)]
        let offRole = sheet[XLSX.utils.encode_cell(roleAddress)]
        if (offRole == undefined || offName == undefined) {continue}

        let offData = {name: offName.v, roles: [offRole.v]}

        // Also record league and cert if present
        let offLeague = sheet[XLSX.utils.encode_cell(leagueAddress)]
        if (offLeague != undefined) {
            offData.league = offLeague.v
        }
        let offCert = sheet[XLSX.utils.encode_cell(certAddress)]
        if (offCert != undefined) {
            offData.certifications = [{level: offCert.v}]
        }

        sbData.teams.officials.persons.push(offData)
    }

}

let updateFileInfo = () => {
    // Update the "File Information Box"
    // Update File Information Box
    fileInfoBox.innerHTML = `<strong>Filename:</strong>  ${sbFilename}<br>`
    fileInfoBox.innerHTML += `<strong>SB Version:</strong> ${sbVersion}<br>`
    fileInfoBox.innerHTML += `<strong>Game Date:</strong> ${moment(sbData.date).format('MMMM DD, YYYY')}<br>`
    fileInfoBox.innerHTML += `<strong>Team 1:</strong> ${sbData.teams['home'].league} ${sbData.teams['home'].name}<br>`
    fileInfoBox.innerHTML += `<strong>Team 2:</strong> ${sbData.teams['away'].league} ${sbData.teams['away'].name}<br>`
    fileInfoBox.innerHTML += `<strong>File Read:</strong> ${moment().format('HH:mm:ss MMM DD, YYYY')}`
}

let readScores = (workbook) => {
    // Given a workbook, extract the information from the score tab

    let cells = {},
        maxJams = sbTemplate.score.maxJams,
        sheet = getSheet(workbook, sbTemplate.score.sheetNumber),
        jamAddress = {},
        jammerAddress = {},
        jamNumber = {},
        tripAddress = {},
        lostAddress = {},
        leadAddress = {},
        callAddress = {},
        injAddress = {},
        npAddress = {},
        skater = {}

    let props = ['firstJamNumber','firstJammerNumber','firstLost','firstLead',
        'firstCall','firstInj','firstNp','firstTrip','lastTrip']
    let tab = 'score'
    let npRe = /(\d)\+NP/
    let ippRe = /(\d)\+(\d)/

    for(let period = 1; period < 3; period ++){
        // For each period, import data

        // Add a period object with a jams array
        let pstring = period.toString()

        for (var i in teamList){ 
            // For each team

            let team = teamList[i]
            let jam = 0
            let starPass = false

            // Get an array of starting points for each type of info
            cells = initCells(team,pstring, tab, props)
            let maxTrips = cells.lastTrip.c - cells.firstTrip.c
            jamAddress.c = cells.firstJamNumber.c
            jammerAddress.c = cells.firstJammerNumber.c
            tripAddress.c = cells.firstTrip.c
            lostAddress.c = cells.firstLost.c
            leadAddress.c = cells.firstLead.c
            callAddress.c = cells.firstCall.c
            injAddress.c = cells.firstInj.c
            npAddress.c = cells.firstNp.c           
        
            for(let l = 0; l< maxJams; l++){

                // For each line in the scoresheet, import data.

                // increment addresses 
                jamAddress.r = cells.firstJamNumber.r + l
                jammerAddress.r = cells.firstJammerNumber.r + l
                tripAddress.r = cells.firstTrip.r + l
                lostAddress.r = cells.firstLost.r + l
                leadAddress.r = cells.firstLead.r + l
                callAddress.r = cells.firstCall.r + l
                injAddress.r = cells.firstInj.r + l
                npAddress.r = cells.firstNp.r + l

                // determine current jam number
                jamNumber = sheet[XLSX.utils.encode_cell(jamAddress)]
                
                // if we're out of jams, stop
                if (jamNumber == undefined || jamNumber.v == undefined){break}

                // handle star passes
                if (jamNumber.v =='SP' || jamNumber.v == 'SP*'){
                    starPass = true
                    if (jamNumber.v == 'SP'){
                        sbData.periods[pstring].jams[jam -1].events.push(
                            {
                                event: 'star pass',
                                skater: skater
                            }                        
                        )
                    }
                    starPasses.push({period: period, jam: jam})
                } else {
                    // Not a star pass? Update the jam
                    jam = parseInt(jamNumber.v)
                    starPass = false
                }

                // If there isn't currently an numbered object for this jam, create it
                // Note that while the "number" field is one indexed, the jams array itself is zero indexed
                if (!sbData.periods[pstring].jams.find(o => o.number === jam)){
                    sbData.periods[pstring].jams[jam-1] = {number: jam, events: []}
                }

                // Process trips.
                // Add a "pass" object for each trip, including initial passes 
                // (note that even incomplete initial passes get "pass" events.)
                let skaterNum = ' '
                let initCompleted = 'yes'
                
                // Check for no initial pass
                let np = sheet[XLSX.utils.encode_cell(npAddress)]
                if (np != undefined && np.v != undefined){initCompleted = 'no'}

                if (!starPass){
                    // If this line is not a star pass, read in the skater number
                    // and create an intital pass object

                    skaterNum = sheet[XLSX.utils.encode_cell(jammerAddress)].v
                    skater = team + ':' + skaterNum
                    sbData.periods[period].jams[jam-1].events.push(
                        {
                            event: 'pass',
                            number: 1,
                            score: '',
                            skater: skater,
                            team: team,
                            completed: initCompleted
                        }
                    )               
                } else if (jamNumber.v=='SP') {
                    // If THIS team has a star pass, use the skater number from the sheet

                    skaterNum = sheet[XLSX.utils.encode_cell(jammerAddress)].v
                    skater = team + ':' + skaterNum
                }  // Final case - jam number is SP*.   
                //  Do nothing: skater number should remain untouched from prior line)

                // Check for subsequent trips, and add additional pass objects            

                for (let trip=2; trip < maxTrips + 2; trip++){
                    tripAddress.c = cells.firstTrip.c + trip - 2
                    let tripScore = sheet[XLSX.utils.encode_cell(tripAddress)]
                    if (tripScore == undefined){
                        // ERROR CHECK - no trip score, initial pass completed
                        if (initCompleted == 'yes' && trip == 2 && !starPass){
                            sbErrors.scores.noPointsNoNP.events.push(
                                `Team: ${ucFirst(team)}, Period: ${period}, Jam: ${jam}, Jammer: ${skaterNum} `
                            )
                        }    
                        continue
                    }

                    
                    let reResult = []
                    let ippResult = []
                    let points = 0

                    if((reResult = npRe.exec(tripScore.v))){
                        // If score is x + NP, extract score and update initial trip
                        points = reResult[1]
                        sbData.periods[period].jams[jam-1].events.find(
                            x => x.event == 'pass' && x.number == 1 && x.skater == skater
                        ).score = points
                    } else if (tripScore.f != undefined && (ippResult = ippRe.exec(tripScore.f))){
                        // If score is x + x, extract scores and add points to prior AND current trip
                        sbData.periods[period].jams[jam-1].events.find(
                            x => x.event == 'pass' && x.number == 1 && x.skater == skater
                        ).score = ippResult[1]
                        sbData.periods[period].jams[jam-1].events.push(
                            {
                                event: 'pass',
                                number: trip,
                                score: ippResult[2],
                                skater: skater,
                                team: team
                            }                               
                        )
                    } else {
                        points = tripScore.v
                        sbData.periods[period].jams[jam-1].events.push(
                            {
                                event: 'pass',
                                number: trip,
                                score: points,
                                skater: skater,
                                team: team
                            }                            
                        )
                    }

                    // ERROR CHECK: No Pass box checked with points given.
                    if (initCompleted == 'no' && !reResult){
                        sbErrors.scores.npPoints.events.push(
                            `Team: ${ucFirst(team)}, Period: ${period}, Jam: ${jam}, Jammer: ${skaterNum} `
                        )
                    }


                }
                // Lost Lead
                let lost = sheet[XLSX.utils.encode_cell(lostAddress)]
                if (lost != undefined && lost.v != undefined){
                    sbData.periods[period].jams[jam-1].events.push(
                        {
                            event: 'lost',
                            skater: skater
                        }
                    )
                }
                // Lead
                let lead = sheet[XLSX.utils.encode_cell(leadAddress)]
                if (lead != undefined && lead.v != undefined){
                    sbData.periods[period].jams[jam-1].events.push(
                        {
                            event: 'lead',
                            skater: skater
                        }
                    )
                }
                // Call
                let call = sheet[XLSX.utils.encode_cell(callAddress)]
                if (call != undefined && call.v != undefined){
                    sbData.periods[period].jams[jam-1].events.push(
                        {
                            event: 'call',
                            skater: skater
                        }
                    )
                }
                // Injury
                let inj = sheet[XLSX.utils.encode_cell(injAddress)]
                if (inj != undefined && inj.v != undefined){
                    sbData.periods[period].jams[jam-1].events.push(
                        {
                            event: 'injury',
                            skater: skater
                        }
                    )
                }
            }
            
        }
        // End of period - check for cross team errors

        for (let j in sbData.periods[period].jams){
            // ERROR CHECK: Lead box checked more than once in the same jam
            let jam = parseInt(j) + 1
            if (sbData.periods[period].jams[j].events.filter(
                x => x.event == 'lead'
            ).length >= 2){
                sbErrors.scores.tooManyLead.events.push(
                    `Period: ${period}, Jam: ${jam}`
                )
            }
    
            // ERROR CHECK: Call box checked for both jammers in same jam
            if (sbData.periods[period].jams[j].events.filter(
                x => x.event == 'call'
            ).length >= 2){
                sbErrors.scores.tooManyCall.events.push(
                    `Period: ${period}, Jam: ${jam}`
                )
            }

            // ERROR CHECK: Injury box checked for only one team in a jam.
            if (sbData.periods[period].jams[j].events.filter(
                x => x.event == 'injury'
            ).length == 1){
                sbErrors.scores.injuryOnlyOnce.events.push(
                    `Period: ${period}, Jam: ${jam}`
                )
            }
        }
    }
    // All score data read
    for (var sp in starPasses){
        if (starPasses.filter(
            x=> x.period == starPasses[sp].period && x.jam == starPasses[sp].jam
        ).length==1){
            sbErrors.scores.onlyOneStarPass.events.push(
                `Period: ${starPasses[sp].period} Jam: ${starPasses[sp].jam}`                
            )
        }
    }
}

let readPenalties = (workbook) => {
    // Given a workbook, extract the data from the "Penalties" tab.

    let cells = {},
        numberAddress = {},
        penaltyAddress = {},
        jamAddress = {},
        foAddress = {},
        foJamAddress = {},
        benchExpCodeAddress = {},
        benchExpJamAddress = {},
        foulouts = [],
        maxPenalties = sbTemplate.penalties.maxPenalties,
        sheet = getSheet(workbook, sbTemplate.penalties.sheetNumber)

    for(let period = 1; period < 3; period ++){
        // For each period

        let pstring = period.toString()

        let props = ['firstNumber','firstPenalty','firstJam',
            'firstFO','firstFOJam','benchExpCode','benchExpJam']
        let tab = 'penalties'

        for(let i in teamList){
            // For each team

            let team = teamList[i]

            // Maximum number of skaters per team
            let maxNum = sbTemplate.teams[team].maxNum

            // Read in starting positions for penalty parameters
            cells = initCells(team, pstring, tab, props)
            numberAddress.c = cells.firstNumber.c
            penaltyAddress.c = cells.firstPenalty.c
            jamAddress.c = cells.firstJam.c
            foAddress.c = cells.firstFO.c
            foJamAddress.c = cells.firstFOJam.c

            for(let s = 0; s < maxNum; s++){
                // For each player
                
                // Advance two rows per skater - TODO make this settable?
                numberAddress.r = cells.firstNumber.r + (s * 2)
                penaltyAddress.r = cells.firstPenalty.r + (s * 2)
                jamAddress.r = cells.firstJam.r + (s * 2)
                foAddress.r = cells.firstFO.r + (s * 2)
                foJamAddress.r = cells.firstFOJam.r + (s*2)

                let skaterNum = sheet[XLSX.utils.encode_cell(numberAddress)]

                if (skaterNum == undefined || skaterNum.v == ''){continue}

                let skater = team + ':' + skaterNum.v

                for(let p = 0; p < maxPenalties; p++){
                    // For each penalty space

                    penaltyAddress.c = cells.firstPenalty.c + p
                    jamAddress.c = cells.firstJam.c + p

                    // Read the penalty code and jam number
                    let codeText = sheet[XLSX.utils.encode_cell(penaltyAddress)]
                    let jamText = sheet[XLSX.utils.encode_cell(jamAddress)]

                    if(codeText == undefined || jamText == undefined){
                        //TODO - handle if ONE of these is missing
                        continue
                    }

                    let code = codeText.v,
                        jam = jamText.v

                    // Add a penalty event to that jam
                    sbData.periods[period].jams[jam - 1].events.push(
                        {
                            event: 'penalty',
                            skater: skater,
                            penalty: code
                        }
                    )
                    penalties[skater].push([jam, code])
                     
                }

                // Check for FO or EXP, add events
                let foCode = sheet[XLSX.utils.encode_cell(foAddress)]
                let foJam = sheet[XLSX.utils.encode_cell(foJamAddress)]

                if(foCode==undefined || foJam==undefined){
                    //TODO - handle if only one is missing

                    // ERROR CHECK: Seven or more penalties with NO foulout entered 
                    if (foulouts.indexOf(skater) == -1 
                        && penalties[skater].length > 6 
                        && period == '2'){
                        sbErrors.penalties.sevenWithoutFO.events.push(
                            `Team: ${ucFirst(team)}, Skater: ${skaterNum.v}`
                        )
                    }

                    continue
                }
                
                // If there is a FO or expulsion, add an event
                // Note that derbyJSON doesn't actually record foul-outs,
                // so just record the expulsion and put code here later
                // for FO sanity checking
                if (foCode.v != 'FO'){
                    sbData.periods[period].jams[foJam.v -1].events.push(
                        {
                            event: 'expulsion',
                            skater: skater,
                            notes: [
                                {note: 'Penalty: ' + foCode.v},
                                {note: 'Jam: ' + foJam.v}
                            ]
                        }
                    )

                    // ERROR CHECK: Expulsion code for a jam with no penalty
                    if (sbData.periods[period].jams[foJam.v - 1].events.filter(
                        x => x.event == 'penalty' && x.skater == skater
                    ).length < 1){
                        sbErrors.penalties.expulsionNoPenalty.events.push(
                            `Period: ${period}, Jam: ${foJam.v}, Team: ${ucFirst(team)}, Skater: ${skaterNum.v}`
                        )
                    }

                }

                if (foCode.v == 'FO'){
                    foulouts.push(skater)
                }

                // ERROR CHECK: FO entered with fewer than seven penalties
                if (foCode.v == 'FO' && penalties[skater].length < 7){
                    sbErrors.penalties.foUnder7.events.push(
                        `Period: ${period}, Team: ${ucFirst(team)}, Skater: ${skaterNum.v}`
                    )
                }

            }

            // Deal with bench expulsions
            benchExpCodeAddress.r = cells.benchExpCode.r
            benchExpJamAddress.r = cells.benchExpJam.r

            for (let e = 0; e < 2; e++){
                benchExpCodeAddress.c = cells.benchExpCode.c + e
                benchExpJamAddress.c = cells.benchExpJam.c + e

                let benchExpCode = sheet[XLSX.utils.encode_cell(benchExpCodeAddress)]
                let benchExpJam = sheet[XLSX.utils.encode_cell(benchExpJamAddress)]

                if (benchExpCode == undefined || benchExpJam == undefined){
                    continue
                }
                sbData.periods[period].jams[benchExpJam.v - 1].events.push(
                    {
                        event: 'expulsion',
                        notes: [
                            {note: 'Bench Staff Expulsion - ' + benchExpCode.v},
                            {note: 'Jam: ' + benchExpJam.v}
                        ]
                    }
                )


            }
        }
    }

}

let readLineups = (workbook) => {
    // Read in the data from the lineups tab.

    let cells = {},
        jamNumberAddress = {},
        noPivotAddress = {},
        skaterAddress = {},
        skaterList = [],
        maxJams = sbTemplate.lineups.maxJams,
        boxCodes = sbTemplate.lineups.boxCodes,
        sheet = getSheet(workbook, sbTemplate.lineups.sheetNumber),
        positions = {0:'jammer',1:'pivot',2:'blocker',3:'blocker',4:'blocker'}

    for (let period = 1; period < 3; period++){
        // For each period

        let pstring = period.toString()

        let props = ['firstJamNumber','firstNoPivot','firstJammer']
        let tab = 'lineups'

        for(var i in teamList){
            // For each team
            let team = teamList[i]
            let jam = 0
            let starPass = false
            // Array of skaters in the box.
            let box = []

            cells = initCells(team, pstring, tab, props)
            jamNumberAddress.c = cells.firstJamNumber.c
            noPivotAddress.c = cells.firstNoPivot.c
            skaterAddress.c = cells.firstJammer.c

            for(let l = 0; l < maxJams; l++){
                // For each line

                jamNumberAddress.r = cells.firstJamNumber.r + l
                noPivotAddress.r = cells.firstNoPivot.r + l
                skaterAddress.r = cells.firstJammer.r + l

                let jamText = sheet[XLSX.utils.encode_cell(jamNumberAddress)]

                if (jamText == undefined || jamText.v == '') {continue}
                // TODO - maybe change this to not give up if the jam # is blank?
                if (jamText.v != 'SP' && jamText.v != 'SP*'){
                    // Unless this is a starpass line, update the jam number
                    jam = jamText.v
                    starPass = false
                    skaterList = []
                } else if (jamText.v == 'SP*'){
                    continue
                } else {
                    starPass = true
                }

                // Retrieve penalties from this jam and prior jam for
                // error checking later
                let thisJamPenalties = sbData.periods[pstring].jams[jam-1].events.filter(
                    x => (x.event == 'penalty' && x.skater.substr(0,4) == team)
                )
                let priorJamPenalties = []
                if (jam != 1) {
                    priorJamPenalties = sbData.periods[pstring].jams[jam-2].events.filter(
                        x => (x.event == 'penalty' && x.skater.substr(0,4) == team)
                    )
                } else if (period == 2){
                    priorJamPenalties = sbData.periods['1'].jams[
                        sbData.periods['1'].jams.length - 1
                    ].events.filter(
                        x=> (x.event == 'penalty' && x.skater.substr(0,4) == team)
                    )
                }

                for(let s = 0; s < 5; s++){
                    // For each skater
                    let position = ''
                    
                    skaterAddress.c = cells.firstJammer.c + (s * (boxCodes+1))

                    let skaterText = sheet[XLSX.utils.encode_cell(skaterAddress)]
                    let noPivot = sheet[XLSX.utils.encode_cell(noPivotAddress)]

                    if (skaterText == undefined){continue}

                    let skater = team + ':' + skaterText.v
                    // ERROR CHECK: Same skater entered more than once per jam
                    if (skaterList.indexOf(skater) != -1 && !starPass){
                        sbErrors.lineups.samePlayerTwice.events.push(
                            `Period: ${period}, Jam: ${jam}, Team: ${ucFirst(team)}, Skater: ${skaterText.v}`
                        )
                    }

                    if (!starPass) {skaterList.push(skater)}

                    if (s == 1 && noPivot != undefined && noPivot.v != undefined){
                        position = 'blocker'
                    } else {
                        position = positions[s]
                    }            

                    if (!starPass){
                    // Unless this is a star pass, add a 
                    //"lineup" event for that skater with the position
                        sbData.periods[pstring].jams[jam -1].events.push(
                            {
                                event: 'lineup',
                                skater: skater,
                                position: position
                            }
                        )

                    }

                    let allCodes = ''
                    // Add box codes if present
                    for (let c = 1; c <= boxCodes; c++){
                        // for each code box

                        skaterAddress.c = cells.firstJammer.c + (s * (boxCodes+1)) + c
                        let codeText = sheet[XLSX.utils.encode_cell(skaterAddress)]

                        if (codeText == undefined) {continue}
                        allCodes += codeText.v

                        // Possible codes - /, X, S, $, I or |, 3
                        // Possible events - enter box, exit box, injury
                        // / - Enter box
                        // X - Test to see if skater is IN box
                        //      Yes: exit box, No: enter box, exit box
                        // S - Enter box, note: sat between jams
                        // $ - Enter box, exit box, note: sat between jams
                        // I or | - no event, error checking only
                        // 3 - Injury object, verify not already present from score tab

                        switch (codeText.v){
                        case '/':
                            // Add an "Enter Box" event, and push the skater onto the box list
                            sbData.periods[pstring].jams[jam-1].events.push(
                                {
                                    event: 'enter box',
                                    skater: skater                                        
                                }
                            )
                            box.push(skater)

                            // ERROR CHECK: Skater enters the box during the jam
                            // without a penalty in the current jam.
                            if(thisJamPenalties.find(
                                x => x.skater == skater                                        
                            ) == undefined){
                                sbErrors.lineups.slashNoPenalty.events.push(
                                    `Period: ${pstring}, Jam: ${jam}, Team: ${ucFirst(team)}, Skater: ${skaterText.v}`
                                )
                            }
                            break
                        case 'X':
                            if (!box.includes(skater)){
                                // If the skater is not in the box, add an "enter box" event
                                sbData.periods[pstring].jams[jam-1].events.push(
                                    {
                                        event: 'enter box',
                                        skater: skater                                        
                                    }
                                )
                                // ERROR CHECK: Skater enters the box during the jam 
                                // without a penalty in the current jam.
                                if(thisJamPenalties.find(
                                    x => x.skater == skater                                        
                                ) == undefined){
                                    sbErrors.lineups.xNoPenalty.events.push(
                                        `Period: ${pstring}, Jam: ${jam}, Team: ${ucFirst(team)}, Skater: ${skaterText.v}`
                                    )
                                }

                            }
                            // Whether or not the skater started in the box, add an "exit box" event
                            sbData.periods[pstring].jams[jam-1].events.push(
                                {
                                    event: 'exit box',
                                    skater: skater                                        
                                }
                            )
                            // Remove the skater from the box list.
                            if (box.includes(skater)){
                                remove(box,skater)
                            }                             
                            break

                        case 'S':
                            // Add a box entry, with a note that the skater sat between jams.
                            sbData.periods[pstring].jams[jam-1].events.push(
                                {
                                    event: 'enter box',
                                    skater: skater,
                                    note: 'Sat between jams'                                        
                                }
                            )
                            // Add skater to the box list.
                            box.push(skater)

                            // ERROR CHECK: Skater starts in the box without a penalty
                            // in the prior or current jam.
                            if(thisJamPenalties.find(x => x.skater == skater) == undefined
                                && priorJamPenalties.find(x => x.skater == skater) == undefined){
                                sbErrors.lineups.sNoPenalty.events.push(
                                    `Period: ${pstring}, Jam: ${jam}, Team: ${ucFirst(team)}, Skater: ${skaterText.v}`
                                )
                            }
                            break

                        case '$':
                            sbData.periods[pstring].jams[jam-1].events.push(
                                {
                                    event: 'enter box',
                                    skater: skater,
                                    note: 'Sat between jams'                                        
                                }
                            )
                            sbData.periods[pstring].jams[jam-1].events.push(
                                {
                                    event: 'exit box',
                                    skater: skater                                        
                                }
                            ) 
                            // ERROR CHECK: Skater starts in the box without a penalty
                            // in the prior or current jam.
                            if(thisJamPenalties.find(x => x.skater == skater) == undefined
                                && priorJamPenalties.find(x => x.skater == skater) == undefined){
                                sbErrors.lineups.sSlashNoPenalty.events.push(
                                    `Period: ${pstring}, Jam: ${jam}, Team: ${ucFirst(team)}, Skater: ${skaterText.v}`
                                )
                            }
                            
                            break
                        case 'I':
                        case '|':
                            // no event, but use this branch for checking if needed
                            if (!box.includes(skater)){
                                sbErrors.lineups.iNotInBox.events.push(
                                    `Period: ${pstring}, Jam: ${jam}, Team: ${ucFirst(team)}, Skater: ${skaterText.v}`
                                )
                            }                                
                            break
                        case '3':
                            sbData.periods[pstring].jams[jam-1].events.push(
                                {
                                    event: 'injury',
                                    skater: skater                                        
                                }
                            )
                            break
                        default:
                        // Handle incorrect lineup codes?
                            break
                        }

                    }
                    // Done reading all codes

                    // ERROR CHECK: is there a skater still in the box without
                    // any code on the present line?
                    if (box.includes(skater) && !allCodes){
                        sbErrors.lineups.seatedNoCode.events.push(
                            `Period: ${pstring}, Jam: ${jam}, Team: ${
                                ucFirst(skater.substr(0,4))
                            }, Skater: ${skater.slice(5)}`
                        )
                        remove(box,skater)
                    }

                }
                // Done reading line

                // ERROR CHECK: Skaters with penalties not listed on the lineup tab
                for (let p in thisJamPenalties){
                    if(skaterList.indexOf(thisJamPenalties[p].skater) == -1){
                        sbErrors.penalties.penaltyNoLineup.events.push(
                            `Period: ${pstring}, Jam: ${jam}, Team: ${
                                ucFirst(thisJamPenalties[p].skater.substr(0,4))
                            }, Skater: ${thisJamPenalties[p].skater.slice(5)}`
                        )
                    }
                }
            }

        }
    }

}

let errorCheck = () => {
    // Run error checks that occur after all data has been read

    let jams = 0,
        events = [],
        pstring = ''

    for (let period = 1; period < 3; period++){

        pstring = period.toString()
        jams  = sbData.periods[pstring].jams.length

        for (var jam = 1; jam <= jams; jam++){
            events = sbData.periods[pstring].jams[jam - 1].events

            // Get the list of Penalties in this jam
            let thisJamPenalties = events.filter(
                x => x.event == 'penalty'
            )

            // Get lead jammer if present (will only catch FIRST if two are marked)
            let leadJammer = ''
            let leadEvent = events.filter(x => x.event == 'lead')
            if (leadEvent.length != 0){
                leadJammer = leadEvent[0].skater
            }

            // Get the list of box entires in the current jam and the next one
            let thisJamEntries = events.filter(
                x => x.event == 'enter box'    
            )
            let nextJamEntries = []
            if (period == 1 && jam==(jams)){
                // If this is the last jam of the 1st period, get period 2, jam 1
                nextJamEntries = sbData.periods['2'].jams[0].events.filter(
                    x => x.event == 'enter box'
                )
            } else if (jam != (jams)){
                // Otherwise, just grab the next jam (don't forget 0 indexing)
                nextJamEntries = sbData.periods[pstring].jams[jam].events.filter(
                    x => x.event == 'enter box'
                )
            }   // Last jam of the 2nd period gets ignored.

            //ERROR CHECK: Penalty without box entry in this jam
            //or the following jam.
            for (let pen in thisJamPenalties){
                if (thisJamEntries.filter(
                    x => x.skater == thisJamPenalties[pen].skater
                ).length == 0 && nextJamEntries.filter(
                    x => x.skater == thisJamPenalties[pen].skater
                ).length == 0){
                    sbErrors.penalties.penaltyNoEntry.events.push(
                        `Period: ${period}, Jam: ${jam}, Team: ${
                            ucFirst(thisJamPenalties[pen].skater.substr(0,4))
                        }, Skater: ${thisJamPenalties[pen].skater.slice(5)}`
                    )
                }
            }

            //ERROR CHECK: Jammer with lead and penalty, but not lost
            if (leadJammer != ''
                && thisJamPenalties.filter(x => x.skater == leadJammer).length != 0
                && events.filter(x => x.event == 'lost' && x.skater == leadJammer).length == 0
            ){
                sbErrors.scores.leadPenaltyNotLost.events.push(
                    `Period: ${period}, Jam: ${jam}, Team: ${
                        ucFirst(leadJammer.substr(0,4))
                    }, Jammer: ${leadJammer.slice(5)}`
                )
            }

        }
    }

}

let getSheet = (workbook, number) => {
    // Given a workbook and a sheet number, return the sheet
    let sheetName = workbook.SheetNames[number]
    return workbook.Sheets[sheetName]
}

let cellValue = (workbook, pair) => {
    // Given a workbook and an array of [sheet #, cell] 
    // return the value
    let sheetName = workbook.SheetNames[pair[0]]
    let worksheet = workbook.Sheets[sheetName]
    let desired_cell = worksheet[pair[1]]
    return (desired_cell ? desired_cell.v : undefined)
}

let nameRowCol = (workbook,pair) => {
    // Given a workbook and an array of [sheet #, cell]
    // return an array of [worksheet object, row #, col #] (zero indexed)
    let sheetName = workbook.SheetNames[pair[0]]
    let worksheet = workbook.Sheets[sheetName]
    let row = XLSX.utils.decode_cell(pair[1]).r
    let col = XLSX.utils.decode_cell(pair[1]).c
    return [worksheet, row, col]
}

let initCells = (team, period, tab, props) => {
    // Given a team, period, SB section, and list of properties,
    // return an object of addresses for those properties.
    // Team should be 'home' or 'away'
    let cells = {}

    for (let i in props){
        cells[props[i]] = XLSX.utils.decode_cell(
            sbTemplate[tab][period][team][props[i]])
    }

    return cells
}

let remove = (array, element) => {
    // Lifted from https://blog.mariusschulz.com/
    const index = array.indexOf(element)
    
    if (index !== -1) {
        array.splice(index, 1)
    }
}

let encode = (s) => {
    var out = []
    for ( var i = 0; i < s.length; i++ ) {
        out[i] = s.charCodeAt(i)
    }
    return new Uint8Array( out )
}

let sbErrorsToTable = () => {
    // Build error report

    let errorTypes = ['scores','lineups','penalties']
    let typeHeaders = ['Scores', 'Lineups', 'Penalties']
    let table = document.createElement('table')
    table.setAttribute('class','table')

    for(let t in errorTypes){
        // For each of the three types of errors

        let section = errorTypes[t]

        let secHead = document.createElement('tr')
        let secCell = document.createElement('th')
        secCell.appendChild(document.createTextNode(typeHeaders[t]))
        secHead.appendChild(secCell)
        secHead.setAttribute('class','thead-dark')

        table.appendChild(secHead)
        let noErrors = true

        for(let e in sbErrors[errorTypes[t]]){
            // For each error in the type

            if (sbErrors[errorTypes[t]][e].events.length == 0) {
                continue
            }
            noErrors = false
            let descRow = document.createElement('tr')
            let descCell = document.createElement('th')
            descCell.appendChild(document.createTextNode(
                sbErrors[section][e].description
            ))
            descRow.appendChild(descCell)
            descRow.setAttribute('class','thead-light')

            table.appendChild(descRow)

            for(let v in sbErrors[errorTypes[t]][e].events){
                let evRow = document.createElement('tr')
                let evCell = document.createElement('td')
                evCell.appendChild(document.createTextNode(
                    sbErrors[section][e].events[v]
                ))
                evRow.appendChild(evCell)

                table.appendChild(evRow)
            }

        }
        if(noErrors){secHead.remove()}
    }
    
    if (table.rows.length == 0){
        let secHead = document.createElement('tr')
        let secCell = document.createElement('th')
        secCell.appendChild(document.createTextNode('No Errors Found!'))
        secHead.appendChild(secCell)
        table.appendChild(secHead)        
    }

    return table
}

let ucFirst = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

/*
List of error checks to be implemented from IGRF Tool.
(* = Done)

Check while reading:

Just Scores
1. NP checked with points.*
2. No points (including a zero) entered, but NP *not* checked.*
3. "Lead" checked for both jammers.*
4. "Call" checked for both jammers.*
5. "Injury" checked on one team but not the other.*
6. Star pass for only one team.*

Just Penalties
1. "FO" entered for skater with fewer than 7 penalties.*
2. Seven or more penalties without "FO" or expulsion code entered.*
3. Expulsion code entered for jam with no penalty.*

Just Lineups
1. Players listed more than once in the same jam on the lineup tab.*
2. "I" or "|" in lineups without the player being in the box already.*

Lineups + Penalties (Check while reading lineups)
1. Penalties on skaters not listed on the lineup for that jam.*
2. "X" in lineups without a matching penalty.*
3. "/" in lineups without a matching penalty.*
4. "S" or "$" in lineups without a matching penalty.*

Check after all data read:
Lineups + Penalties:
1. Penalty recorded without a "X", "/", "S", or "$". *

Scores + Penalties
1. Jammers with lead and a penalty, but not marked "lost."*

List of error checks I'm not going to BOTHER implementing, because 
the statsbook now has conditional formatting to flag them
1. Skater numbers on any sheet not on the IGRF. 
2. Jammers that don't match between lineups and scores. 
3. SP matching between lineups and scores.
*/