const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = "Server = osuquizbowldb.database.windows.net,1433;Initial Catalog = quizbowldb;Persist Security Info = False;User ID = qzbowladmin; Password = tvHf37hYkVhQ; MultipleActiveResultSets = False; Encrypt = True; TrustServerCertificate = False;Connection Timeout = 30";

app.http('ListAllQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);

        const data = await pool.request().query("SELECT TOP 10 * FROM [dbo].[QuizQuestions]");

        context.res = data.recordset;
    }
});
