const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

// Will fetch a given number of randomly picked questions from the database.

// URL Parameters:
// - amt: INT - The amount of results to return. Set this to 0 to return all lines in the database. If left blank, default is 12.
// - topic: STRING - A topic to filter by. If left blank, will not filter by topic.
// - level: STRING - A difficulty level to filter questions at. If left blank, filter will not apply.
// - species: STRING - A species to filter questions by. If left blank, filter will not apply.

app.http('PickRandomQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const amount = decodeURI(request.query.get('amt') || 25);
        const topic = decodeURI(request.query.get('topic') || "");
        const difficulty = decodeURI(request.query.get('level') || "");
        const species = decodeURI(request.query.get("species") || "");
        var filters = false;

        queryString = "SELECT id FROM [dbo].[QuizQuestions]";

        if (topic.length > 0) {
            queryString = queryString + " WHERE Topic LIKE '" + topic + "'";
            filters = true;
        }

        if (difficulty.length > 0) {
            if (!filters) {
                queryString = queryString + " WHERE Level LIKE '" + difficulty + "'";
                filters = true;
            } else {
                queryString = queryString + " AND Level LIKE '" + difficulty + "'";
            }
        }

        if (species.length > 0) {
            if (!filters) {
                queryString = queryString + " WHERE Species LIKE '" + species + "'";
                filters = true;
            } else {
                queryString = queryString + " AND Species LIKE '" + species + "'";
            }
        }

        const qids = await pool.request().query(queryString);
        var totalNum = parseInt(qids.recordset.length);
        var results = [];

        if (totalNum < amount) {
            for (var i = 0; i < totalNum; i++) {
                var qString = "SELECT * FROM [dbo].[QuizQuestions] WHERE id = " + qids.recordset[i]["id"];
                var question = await pool.request().query(qString);

                results.push(question.recordset[0]);
            }
        } else {
            var usedNums = [];
            for (var i = 0; i < amount; i++) {
                var randNum = Math.floor(Math.random() * totalNum);
                console.log(i + " - " + randNum);
                if (usedNums.indexOf(randNum) == -1) {
                    usedNums.push(randNum);

                    var qString = "SELECT * FROM [dbo].[QuizQuestions] WHERE id = " + qids.recordset[randNum]["id"];
                    var question = await pool.request().query(qString);

                    results.push(question.recordset[0]);
                } else {
                    i--;
                }
            }
        }

        return { body: JSON.stringify(results) };
    }
});
