const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = process.env['dbconn'];

app.http('RemoveQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);

        // Later on, these parameters will be passed into the API when it is called, but for demo purposes they are set here.
        var target = -1;

        const data = await pool.request().query("DELETE FROM [dbo].[QuizQuestions] WHERE id = " + target);

        context.res = {
            body: data
        };

        return { body: JSON.stringify(data) };
    }
});
