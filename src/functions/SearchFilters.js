const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

app.http('SearchFilters', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const filters = {
            species: [""],
            resource: [""],
            level: [""],
            topic: [""]
        }

        const data = await pool.request().query("SELECT DISTINCT Species, Resource, Level, Topic FROM [dbo].[QuizQuestions]");

        currentFilters = Object.create(filters);
        for (i = 0; i < data.recordset.length; i++) {
            if (currentFilters.species.indexOf(data.recordset[i].Species) < 0) {
                currentFilters.species.push(data.recordset[i].Species);
            }

            if (currentFilters.resource.indexOf(data.recordset[i].Resource) < 0) {
                currentFilters.resource.push(data.recordset[i].Resource);
            }

            if (currentFilters.level.indexOf(data.recordset[i].Level) < 0) {
                currentFilters.level.push(data.recordset[i].Level);
            }

            if (currentFilters.topic.indexOf(data.recordset[i].Topic) < 0) {
                currentFilters.topic.push(data.recordset[i].Topic);
            }
        }

        for (j = 0; j < currentFilters.species.length; j++) {
            if (currentFilters.species[j] == "" || currentFilters.species[j] == null) {
                currentFilters.species.splice(j, 1);
            }
        }

        for (j = 0; j < currentFilters.resource.length; j++) {
            if (currentFilters.resource[j] == "" || currentFilters.resource[j] == null) {
                currentFilters.resource.splice(j, 1);
            }
        }

        for (j = 0; j < currentFilters.level.length; j++) {
            if (currentFilters.level[j] == "" || currentFilters.level[j] == null) {
                currentFilters.level.splice(j, 1);
            }
        }

        for (j = 0; j < currentFilters.topic.length; j++) {
            if (currentFilters.topic[j] == "" || currentFilters.topic[j] == null) {
                currentFilters.topic.splice(j, 1);
            }
        }


        var resString = JSON.parse("[" + JSON.stringify(currentFilters.species) + "," + JSON.stringify(currentFilters.resource) + "," + JSON.stringify(currentFilters.level) + "," + JSON.stringify(currentFilters.topic) + "]");
        console.log(resString);
    
        return { body: resString} ;
    }
});
