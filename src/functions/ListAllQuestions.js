const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

// This function will fetch a given number of questions from the top of the database.

// URL Parameters:
// - amt: The amount of results to return. If left blank, default is 12.

app.http('ListAllQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const amount = parseInt(decodeURI(request.query.get('amt') || 12));

        const data = await pool.request().query("SELECT TOP " + amount + " * FROM [dbo].[QuizQuestions]");
    
        return { body: "{\"questions\":" + JSON.stringify(data.recordset) + "}", headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }};
    }
});
