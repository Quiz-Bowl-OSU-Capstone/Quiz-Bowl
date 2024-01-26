const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env['dbconn'];

app.http('PickRandomQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);

        const data = await pool.request().query("SELECT * FROM questions");
        var randNum = Math.floor(Math.random() * data.recordset.length);

        context.res = {
            body: data.recordset[randNum]
        };
    }
});
