const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

// This function will fetch a given number of questions from the top of the database that are missing some information.

// URL Parameters:
// - amt: The amount of results to return. If left blank, default is 12.

// Note that all API functions require an additional parameter, "uid", which is the user ID of the user making the request.
// This is used to authenticate the user and ensure that they have the correct permissions to make the request.

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('MissingData', {
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
                // Set the amount of questions to fetch. Default is 12, if no number provided.
                const amount = parseInt(decodeURI(request.query.get('amt') || 12));

                // Fetch the top X questions from the database that are missing a species, topic, resource, level, question, or answer.
                const data = await pool.request().query("SELECT TOP " + amount + " * FROM [dbo].[QuizQuestions] WHERE Species IS NULL OR Resource IS NULL OR Level IS NULL OR Question IS NULL OR Answer IS NULL OR Topic IS NULL");

                // Return the questions in a JSON format.
                return {
                    body: "{\"questions\":" + JSON.stringify(data.recordset) + "}", headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                };
            } else {
                throw ("Invalid user ID provided / No user found with that ID.")
            }
        } catch (e) {
            // If an error occurs, log the error and return the error message to the user. Only runs if not in a local environment.
            if (!local) {
                Sentry.withScope((scope) => {
                    scope.setSDKProcessingMetadata({ request: request });
                    Sentry.captureException(e);
                })
                console.log(e);
                await Sentry.flush(2000);
            }

            // Return the error message to the user.
            return {
                body: "{\"Error\":\"" + e + "\"}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            };
        }
    }
});
