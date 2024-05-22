const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

/* 
This function accepts an array of question IDs and updates the lastusagedate field in the database for each question. It takes the following parameters:
 - ids: JSON ARRAY - An array of question IDs to update the lastusagedate field for.
 - event: String (Optional) - The event that triggered the update. This can be used to track the last usage event for each question.
 - date: JSON Date String (Optional) - The date to update the lastusagedate field to. If left blank, the current date and time will be used.

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

app.http('LastUsage', {
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
                // Parse the question IDs and event from the URL parameters. Generate today's date.
                var questions = JSON.parse(decodeURIComponent(request.query.get('ids')));
                var event = decodeURIComponent(request.query.get('event') || "");
                var lastupdated = new Date().toJSON();
        
                // If questions were provided, update the lastusagedate field for each question.
                if (questions != undefined && questions.length > 0) {
                    var target = decodeURI(request.query.get('ids'));
                    var lastupdated = Date.parse(decodeURI(request.query.get('date')));

                    // If date is provided, use that date. Otherwise, use the current date and time.
                    if (isNaN(lastupdated)) {
                        lastupdated = new Date().toISOString();
                    } else {
                        lastupdated = new Date(lastupdated).toISOString();
                    }
                    var data = "";

                    // If targets (question IDs) are provided, create a formatted SQL query to update the lastusagedate field for each of those questions.
                    if (target.indexOf("null") < 0) {
                        target = target.replace("[", "").replace("]", "");
                        var numbers = target.split(",");
                        var queryText = "UPDATE [dbo].[QuizQuestions] SET lastusagedate = \'" + lastupdated + "\', lastusageevent = \'" + event + "\' WHERE ID IN (" + numbers + ")";
                        data = await pool.request().query(queryText);
                    }

                    // Returns the number of questions updated and the new date for the lastusagedate field.
                    return { body: "{\"questionsUpdated\":" + data.rowsAffected[0] + ", \"newdate\": \"" + lastupdated + "\"}", headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }};
                } else {
                    throw("No question IDs provided to update lastusagedate for.")
                }
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
