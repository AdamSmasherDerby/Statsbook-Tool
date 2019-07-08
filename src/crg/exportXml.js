const builder = require('xmlbuilder')

function exportXml(teamData) {
    const root = builder.create('document', {encoding: 'UTF-16'})
    const teams = root.ele('Teams')

    // Cargo cult boilerpplate - I don't know what this part is for,
    // but it's in the original, so I'm leaving it in.
    teams.ele('Reset ')
    const transfer = teams.ele('Transfer')
    let to = transfer.ele('To')
    to.ele('Team1 ')
    to.ele('Team2 ')
    let from = transfer.ele('From')
    from.ele('Team1 ')
    from.ele('Team2')
    const merge = teams.ele('Merge')
    to = merge.ele('To')
    to.ele('Team1 ')
    to.ele('Team2 ')
    from = merge.ele('From')
    from.ele('Team1 ')
    from.ele('Team2 ')

    teamData.forEach(function(team) {
        const teamEl = teams.ele('Team',  {'Id': team.id})
        teamEl.ele('Name').dat(team.name)
        teamEl.ele('Logo ')

        team.skaters.forEach(function(skater) {
            const skaterEl = teamEl.ele('Skater', {'Id': skater.id})

            skaterEl.ele('Name').dat(skater.name)
            skaterEl.ele('Number').dat(skater.number)
            skaterEl.ele('Flags', {'empty': 'true'}).dat(skater.flags)
        })
    })

    return root
}

module.exports = exportXml
