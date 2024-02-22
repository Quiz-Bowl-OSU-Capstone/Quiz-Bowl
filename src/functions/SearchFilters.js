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
                if (data.recordset[i].Species != "" && data.recordset[i].Species != null) {
                    currentFilters.species.push(data.recordset[i].Species);
                }
            }

            if (currentFilters.resource.indexOf(data.recordset[i].Resource) < 0) {
                if (data.recordset[i].Resource != "" && data.recordset[i].Resource != null) {
                    currentFilters.resource.push(data.recordset[i].Resource);
                }
            }

            if (currentFilters.level.indexOf(data.recordset[i].Level) < 0) {
                if (data.recordset[i].Level != "" && data.recordset[i].Level != null) {
                    currentFilters.level.push(data.recordset[i].Level);
                }
            }

            if (currentFilters.topic.indexOf(data.recordset[i].Topic) < 0) {
                if (data.recordset[i].Topic != "" && data.recordset[i].Topic != null) {
                    currentFilters.topic.push(data.recordset[i].Topic);
                }
            }
        }

        resString = "{ \"Species\": [" + currentFilters.species + "], \"Resource\":[" + currentFilters.resource + "], \"Level\":[" + currentFilters.level + "], \"Topic\":[" + currentFilters.topic + "]"

        return { body: resString, headers: {
            'Content-Type': 'application/json'
        }} ;
    }
});
