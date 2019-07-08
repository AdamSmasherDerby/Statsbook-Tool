const uuid = require('uuid/v5');

// use this guid as the namespace for the skater id
const appNamespace = 'f291bfb9-74bf-4c5b-af33-902c19a74bea';

function generateSkaterId(teamId, skaterName) {
    const name = `${teamId}-${skaterName}`;
    return uuid(name, appNamespace);
}

function extractTeamsFromSBData(sbData, teamList) {
    return teamList.map(function(t) {
        let teamName;
        
        if(sbData.teams[t].league) {
            teamName = `${sbData.teams[t].league} ${sbData.teams[t].name}`;
        } else {
            teamName = sbData.teams[t].name;
        }

        const team = {
            id: teamName,
            name: teamName,
            skaters: []
        };

        team.skaters = sbData.teams[t].persons.map(function(person) {
            const skaterName = person.name;
            return {
                id: generateSkaterId(teamName, skaterName),
                name: skaterName,
                number: person.number,
                flags: ""
            }
        });

        return team;
    });
}


module.exports = {
    extractTeamsFromSBData
}