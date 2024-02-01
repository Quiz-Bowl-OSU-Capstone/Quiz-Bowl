const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = process.env.dbconn;

// Will delete a question from the database, given an ID number.

// URL Parameters:
// - id: The id of the question to delete. If left blank, -1 is used, and no questions are deleted from the database.

app.http('RemoveQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const target = request.query.get('id') || -1;
        var data = "";

        if (target != -1) {
            data = await pool.request().query("DELETE FROM [dbo].[QuizQuestions] WHERE id = " + target);
        } else {
            data = "Error: You need to provide a target to delete!";
        }

        context.res = {
            body: data
        };

        return { body: JSON.stringify(data) };
    }
});
