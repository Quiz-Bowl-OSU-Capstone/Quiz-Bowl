const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry;

/* 
This function accepts an array of question IDs and updates the lastusagedate field in the database for each question. It takes the following parameters:
 - ids: JSON ARRAY - An array of question IDs to update the lastusagedate field for.
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
            if (authdata.recordset.length > 0) {
                var questions = JSON.parse(decodeURIComponent(request.query.get('questions')));
                var lastupdated = new Date().toJSON();
        
                if (questions.questions != undefined && questions.questions.length > 0) {
                    var target = decodeURI(request.query.get('ids'));
                    var lastupdated = Date.parse(decodeURI(request.query.get('date')));
                    if (isNaN(lastupdated)) {
                        lastupdated = new Date().toJSON();
                    } else {
                        lastupdated = new Date(lastupdated).toJSON();
                    }
                    var data = "";

                    if (target.indexOf("null") < 0) {
                        target = target.replace("[", "").replace("]", "");
                        var numbers = target.split(",");
                        console.log(numbers)
                        var rowsAffected = 0;
                        for (i = 0; i < numbers.length; i++) {
                            var queryText = "UPDATE [dbo].[QuizQuestions] SET lastusagedate = \'" + lastupdated + "\' WHERE ID = " + numbers[i];
                            console.log(queryText);
                            data = await pool.request().query(queryText);
                            rowsAffected += data.rowsAffected[0];
                        }
                    }

                    return { body: "{\"questionsUpdated\":" + rowsAffected + ", \"newdate\": \"" + lastupdated + "\"}", headers: {
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
