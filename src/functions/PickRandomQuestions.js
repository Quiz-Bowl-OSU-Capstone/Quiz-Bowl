const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry;

// Will fetch a given number of randomly picked questions from the database.

// URL Parameters:
// - amt: INT - The amount of results to return. Set this to 0 to return all lines in the database. If left blank, default is 12.
// - topic: STRING - A topic to filter by. If left blank, will not filter by topic.
// - level: STRING - A difficulty level to filter questions at. If left blank, filter will not apply.
// - species: STRING - A species to filter questions by. If left blank, filter will not apply.

//Note that all API functions require an additional parameter, "uid", which is the user ID of the user making the request. 
//This is used to authenticate the user and ensure that they have the correct permissions to make the request.

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('PickRandomQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const uid = decodeURI(request.query.get('uid') || "");
            const authquery = "SELECT * FROM [dbo].[Accounts] WHERE uid='" + uid + "'";
            const authdata = await pool.request().query(authquery);
            if (authdata.recordset.length > 0) {
                const amount = parseInt(decodeURI(request.query.get('amt') || 12));
                const topic = decodeURI(request.query.get('topic') || "");
                const difficulty = decodeURI(request.query.get('level') || "");
                const species = decodeURI(request.query.get("species") || "");
                const resource = decodeURI(request.query.get("resource") || "");
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

                if (resource.length > 0) {
                    if (!filters) {
                        queryString = queryString + " WHERE Resource LIKE '" + resource + "'";
                        filters = true;
                    } else {
                        queryString = queryString + " AND Resource LIKE '" + resource + "'";
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

                return { body: "{\"questions\":" + JSON.stringify(results) + "}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }};
            } else {
                throw("Invalid user ID provided / No user found with that ID.")
            }
        } catch (e) {
            if (!local) {
                Sentry.withScope((scope) => {
                    scope.setSDKProcessingMetadata({ request: request });
                    Sentry.captureException(e);
                })
                console.log(e);
                await Sentry.flush(2000);
            }
            
            return { body: "{\"Error\":\"" + e + "\"}", headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }};
        }
    }
});
