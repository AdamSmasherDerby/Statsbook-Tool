function exportJson(teams) {
    const state = {};


    teams.forEach((team) => {
        const teamPrefix = `ScoreBoard.PreparedTeam(${team.id})`;

        state[`${teamPrefix}.Id`] = team.id;
        state[`${teamPrefix}.Name`] = team.name;

        team.skaters.forEach((skater) => {
            const skaterPrefix = `${teamPrefix}.Skater(${skater.id})`;

            state[`${skaterPrefix}.Id`] = skater.id;
            state[`${skaterPrefix}.Name`] = skater.name;
            state[`${skaterPrefix}.Number`] = skater.number;
            state[`${skaterPrefix}.Flags`] = skater.flags;
        });
    });


    return { state };
}

module.exports = exportJson;