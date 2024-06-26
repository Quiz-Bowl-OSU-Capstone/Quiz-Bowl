const { app } = require('@azure/functions');
const sql = require('mssql')
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

/* 
This function accepts multiple questions to remove from the database. Questions are deleted by ID number, and must be formatted in a JSON array of question IDS. 
An example formatted version of question IDs to be deleted is as follows:
    
ids=[1,2,3,4,5]

Make sure to encode the JSON object as a URI component before sending it to the function using encodeURIComponent(JSON.stringify()).

Note that all API functions require an additional parameter, "uid", which is the user ID of the user making the request. 
This is used to authenticate the user and ensure that they have the correct permissions to make the request.
*/

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('RemoveQuestions', {
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
                var target = decodeURI(request.query.get('ids'));
                var data = "";
        
                // If more than 0 ids were provided as a target.
                if (target.length > 0) {
                    // Remove the brackets from the JSON array and split the string into an array of numbers. This helps format it into a JSON array.
                    target = target.replace("[", "").replace("]", "");
                    var numbers = target.split(",");

                    // Keeps track of the number of rows affected (i.e. questions deleted)
                    var rowsAffected = 0;

                    // Delete each question by ID number one at a time. Potential for optimization here.
                    for (i = 0; i < numbers.length; i++) {
                        var queryText = "DELETE FROM [dbo].[QuizQuestions] WHERE ID = " + numbers[i];
                        console.log(queryText);
                        data = await pool.request().query(queryText);
                        rowsAffected += data.rowsAffected[0];
                    }
                }
        
                // Return the number of questions deleted in a JSON format.
                return { body: "{\"questionsDeleted\":" + rowsAffected + "}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }};
            } else {
                throw("Invalid user ID provided / No user found with that ID.")
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
            return { body: "{\"Error\":\"" + e + "\"}", headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }};
        }
    }
});
