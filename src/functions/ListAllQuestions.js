const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = process.env.dbconn;

// Will fetch a given number of questions from the top of the database.

// URL Parameters:
// - amt: The amount of results to return. Set this to 0 to return all lines in the database. If left blank, default is 12.

app.http('ListAllQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const amount = request.query.get('amt') || 25;

        const data = await pool.request().query("SELECT TOP " + amount + " * FROM [dbo].[QuizQuestions]");
    
        return { body: JSON.stringify(data.recordset) };
    }
});
