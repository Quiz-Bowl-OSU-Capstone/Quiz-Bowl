const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

app.http('PickRandomQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const numQuestions = 3; // This will be read by input parameters in the future but for now is specified manually here.

        const qids = await pool.request().query("SELECT id FROM [dbo].[QuizQuestions]");
        var totalNum = parseInt(qids.recordset.length);
        var results = [];

        for (var i = 0; i < numQuestions; i++) {
            var randNum = Math.floor(Math.random() * totalNum);

            var qString = "SELECT * FROM [dbo].[QuizQuestions] WHERE id = " + qids.recordset[randNum]["id"];
            var question = await pool.request().query(qString);

            results.push(question.recordset[0]);
        }

        return { body: results };
    }
});
