const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

// Will fetch a given number of randomly picked questions from the database.

// URL Parameters:
// - amt: INT - The amount of results to return. Set this to 0 to return all lines in the database. If left blank, default is 12.
// - topic: STRING - A topic to filter by. If left blank, will not filter by topic.
// - difficulty: INT - A difficulty level to filter questions at. If left blank, filter will not apply. NOT WORKING ATM!!!!

app.http('PickRandomQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const amount = request.query.get('amt') || 25;
        const topic = request.query.get('filter');
        const difficulty = request.query.get('difficulty'); // NOT WORKING

        queryString = "SELECT id FROM [dbo].[QuizQuestions]";

        if (topic != null && difficulty != null) {
            queryString = queryString + " WHERE Topic LIKE '" + topic + "' AND Level = " + difficulty;
        } else if (difficulty != null) {
            queryString = queryString + " WHERE Level = " + difficulty;
        } else if (topic != null) {
            queryString = queryString + " WHERE Topic LIKE '" + topic + "'";
        }

        const qids = await pool.request().query(queryString);
        var totalNum = parseInt(qids.recordset.length);
        var results = [];

        for (var i = 0; i < amount; i++) {
            var randNum = Math.floor(Math.random() * totalNum);

            var qString = "SELECT * FROM [dbo].[QuizQuestions] WHERE id = " + qids.recordset[randNum]["id"];
            var question = await pool.request().query(qString);

            results.push(question.recordset[0]);
        }

        return { body: JSON.stringify(results) };
    }
});
