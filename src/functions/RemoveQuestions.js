const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = process.env.dbconn;

/* 
This function accepts multiple questions to remove from the database. Questions are deleted by ID number, and must be formatted in a JSON array of question IDS. 
An example formatted version of question IDs to be deleted is as follows:
    
ids=[1,2,3,4,5]

Make sure to encode the JSON object as a URI component before sending it to the function using encodeURIComponent(JSON.stringify()).
*/

app.http('RemoveQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        var target = decodeURI(request.query.get('ids'));
        var data = "";

        if (target.length > 0) {
            target = target.replace("[", "").replace("]", "");
            var numbers = target.split(",");
            var rowsAffected = 0;
            for (i = 0; i < numbers.length; i++) {
                var queryText = "DELETE FROM [dbo].[QuizQuestions] WHERE ID = " + numbers[i];
                console.log(queryText);
                data = await pool.request().query(queryText);
                rowsAffected += data.rowsAffected[0];
            }
        }

        return { body: "{\"questionsDeleted\":" + rowsAffected + "}", headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }};
    }
});
