const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

app.http('LastUsage', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const target = decodeURI(request.query.get('id') || -1);
        const timestamp = decodeURI(request.query.get('time') || new Date(Date.now()).toString());
        var data = "";

        var queryString = "UPDATE [dbo].[QuizQuestions] SET updated = " + timestamp + " WHERE id = " + target
        console.log(queryString)

        if (target != -1) {
            data = await pool.request().query(queryString);
        } else {
            data = "Error: You need to provide a target question to update!";
        }

        context.res = {
            body: data
        };

        return { body: JSON.stringify(data) };
    }
});
