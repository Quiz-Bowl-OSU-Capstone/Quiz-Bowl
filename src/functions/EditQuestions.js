const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

/* 
This function accepts multiple questions to edit the database. Questions must be formatted inside of an array of JSON objects, with the following required properties:
 - question: STRING - The question to add.
 - answer: STRING - The answer to the question.
 - topic: STRING - The topic of the question.
 - level: STRING - The difficulty level of the question.
 - species: STRING - The species the question is about.
 - resource: STRING - The resource the question is about.
 - id: INT - The ID of the question that is being edited.

 The array must always be sent as a JSON object with a single property, "questions", which contains the array of questions. An example formatted version of a sample question is as follows:

 questions = {
  "questions": [
    {
      "question": "test",
      "answer": "test",
      "level": "level",
      "topic": "topic",
      "species": "species",
      "resource": "resource",
      "id": id
    },
    {
      ... so on and so forth...
    }
  ]
}

Make sure to encode the JSON object as a URI component before sending it to the function using:

    encodeURIComponent(JSON.stringify(<object>))

Note that all API functions require an additional URI parameter, "uid", which is the user ID of the user making the request. 
This is used to authenticate the user and ensure that they have the correct permissions to make the request. This means your final URL will look something like this:

    https://<functionappname>.azurewebsites.net/api/EditQuestions?uid=<uid>&questions=<questions>
*/

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('EditQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const uid = decodeURI(request.query.get('uid') || "");
            const authquery = "SELECT * FROM [dbo].[Accounts] WHERE uid='" + uid + "'";
            const authdata = await pool.request().query(authquery);
            if (authdata.recordset.length > 0) {
                var rowsAffected = 0;
                const query = "";
                var rawData = await pool.request().query(query);

                /*
                Code to perform the actual question editing goes here. This is a example edit.
                
                Ideally, this involves making some sort of SQL query to update the questions in the database. You can essentially think of this as copying the new values into every field of the old question. Just make sure this data is not added as an entirely new question!

                Please also make sure to update the rowsAffected value for each question you edit, as this is used to return the number of questions that were successfully edited.
                */ 
                
                return {
                    body: "{\"questionsEdited\":" + rowsAffected + "}", headers: { // rowsAffected is the number of questions that were successfully edited.
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                };
            } else {
                throw ("Invalid user ID provided / No user found with that ID.")
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

            return { // Always returns a consistent error msg.
                body: "{\"Error\":\"" + e + "\"}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            };
        }
    }
});
