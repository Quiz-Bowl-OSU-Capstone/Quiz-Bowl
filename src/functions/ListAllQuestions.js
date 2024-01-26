const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = process.env.dbconn;

// Limited to the first 10 elements for easy readability, but can easily be modified to include search filters.
app.http('ListAllQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);

        const data = await pool.request().query("SELECT TOP 10 * FROM [dbo].[QuizQuestions]");
    
        return { body: data.recordset };
    }
});
