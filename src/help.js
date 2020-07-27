let outBox = document.getElementById('output-box')
const sbErrors = require('../assets/sberrors.json')

let sbErrorsToTable = () => {
    // Build error list

    let errorTypes = ['scores','lineups','penalties','warnings']
    let typeHeaders = ['Scores', 'Lineups', 'Penalties','Warnings']
    let table = document.createElement('table')
    table.setAttribute('class','table')
    table.id = ('error-table')

    for(let t in errorTypes){
        // For each of the three types of errors

        let section = errorTypes[t]

        let secHead = document.createElement('tr')
        let secCell = document.createElement('th')
        secCell.appendChild(document.createTextNode(typeHeaders[t]))
        secHead.appendChild(secCell)
        secHead.setAttribute('class','thead-dark')

        table.appendChild(secHead)

        for(let e in sbErrors[errorTypes[t]]){
            // For each error in the type

            let descRow = document.createElement('tr')
            let descCell = document.createElement('th')
            descCell.appendChild(document.createTextNode(
                sbErrors[section][e].description
            ))
            descRow.appendChild(descCell)
            descRow.setAttribute('class','thead-light')

            table.appendChild(descRow)

            let longRow = document.createElement('tr')
            let longCell = document.createElement('td')
            longCell.appendChild(document.createTextNode(
                sbErrors[section][e].long
            ))
            longRow.appendChild(longCell)
            table.appendChild(longRow)

        }

    }

    return table
}

outBox.appendChild(sbErrorsToTable())