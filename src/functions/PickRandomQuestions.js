const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

// Will fetch a given number of randomly picked questions from the database.

// URL Parameters:
// - amt: INT - The amount of results to return. Set this to 0 to return all lines in the database. If left blank, default is 12.
// - topic: STRING - A topic to filter by. If left blank, will not filter by topic.
// - level: STRING - A difficulty level to filter questions at. If left blank, filter will not apply.
// - species: STRING - A species to filter questions by. If left blank, filter will not apply.
// - resource: STRING - A resource to filter questions by. If left blank, filter will not apply.
// - exclude: ARRAY - An array of question IDs to exclude from the results. If left blank, filter will not apply.

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

            // If the user is authentic / exists in the database.
            if (authdata.recordset.length > 0) {
                // Parsing filters, limits, and exclusions from the URL parameters.
                const amount = parseInt(decodeURI(request.query.get('amt') || 20)); // Amount of questions to return. Default 20 (one round in quiz bowl).
                const topic = decodeURI(request.query.get('topic') || ""); // Topic to filter by. Default no filter.
                const difficulty = decodeURI(request.query.get('level') || ""); // Difficulty level to filter by. Default no filter.
                const species = decodeURI(request.query.get("species") || ""); // Species to filter by. Default no filter.
                const resource = decodeURI(request.query.get("resource") || ""); // Resource to filter by. Default no filter.
                var candiDate = decodeURI(request.query.get("date") || ""); // Last-used-before-date to filter by. Default no date specified.
                const exclude = decodeURIComponent(request.query.get("exclude") || "[]").replace("[", "(").replace("]", ")"); // Question IDs to exclude from the results. Default none.
                
                // console.log(exclude); - debug

                // Now we need to build the query string based on the filters provided. Each of these if statements will add a WHERE/AND clause to the query string if the filter is provided.
                var filters = false;

                // This query actually returns a list of question IDs that match the filters provided, not the full question data. More detail as to why this is done is provided in the comments below.
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

                if (exclude.length > 2) {
                    if (!filters) {
                        queryString = queryString + " WHERE id NOT IN " + exclude;
                        filters = true;
                    } else {
                        queryString = queryString + " AND id NOT IN " + exclude;
                    }
                }

                if (candiDate.length > 0) {
                    var date = new Date(candiDate);
                    // console.log("Date detected. Filtering by date: " + date.toDateString() + "."); - debug
                    if (!filters) {
                        queryString = queryString + " WHERE lastusagedate < '" + date.toISOString().substring(0,10) + "' OR lastusagedate IS NULL";
                        filters = true;
                    } else {
                        queryString = queryString + " AND lastusagedate < '" + date.toISOString().substring(0,10) + "' OR lastusagedate IS NULL";
                    }
                }

                //console.log(queryString); - debug

                // Performing the actual query now.
                const qids = await pool.request().query(queryString);

                // Getting the total number of questions that match the filters provided.
                var totalNum = parseInt(qids.recordset.length);

                // This is the empty array that will store the questions at the end.
                var results = [];

                // The idea for this program is that the API function now randomly selects questions from the returned array of questions that match the filters provided.
                // This is done because it's easier to handle a smaller array of entirely question IDs and then fetch the full question data for each of those questions instead of fetching full question data for all questions.
                // Question IDs also aren't entirely sequential, so it's easier to handle them in this way just to make sure we always get correct question data each time.

                // If the total number of questions that match the filters is less than the amount requested, return all questions that match the filters.
                if (totalNum < amount) {
                    // The SQL query probably does not need to be in a for loop, so there is potential for optimization here.
                    for (var i = 0; i < totalNum; i++) {
                        var qString = "SELECT * FROM [dbo].[QuizQuestions] WHERE id = " + qids.recordset[i]["id"];
                        var question = await pool.request().query(qString);

                        results.push(question.recordset[0]);
                    }
                } else {
                    var usedNums = [];
                    // The SQL query probably does not need to be in a for loop, so there is potential for optimization here.

                    // For (amount) times, fetch a randomly picked question from the database by ID number.
                    for (var i = 0; i < amount; i++) {
                        var randNum = Math.floor(Math.random() * totalNum);
                        if (usedNums.indexOf(randNum) == -1) {
                            usedNums.push(randNum);

                            // Fetches a single question one at a time and pushes it onto results.
                            var qString = "SELECT * FROM [dbo].[QuizQuestions] WHERE id = " + qids.recordset[randNum]["id"];
                            var question = await pool.request().query(qString);

                            results.push(question.recordset[0]);
                        } else {
                            // If the random number is already used, decrement i to try again.
                            i--;
                        }
                    }
                }

                // Return the final questions chosen.
                return { body: "{\"questions\":" + JSON.stringify(results) + "}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }};
            } else {
                throw("Invalid user ID provided / No user found with that ID.")
            }
        } catch (e) {
            // If an error occurs, log the error and send it to Sentry. Only do so if the function is not running locally (production).
            if (!local) {
                Sentry.withScope((scope) => {
                    scope.setSDKProcessingMetadata({ request: request });
                    Sentry.captureException(e);
                })
                console.log(e);
                await Sentry.flush(2000);
            }

            // Return a consistent error if needed.
            return { body: "{\"Error\":\"" + e + "\"}", headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }};
        }
    }
});
