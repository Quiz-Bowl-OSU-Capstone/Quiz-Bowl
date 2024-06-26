const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

/* 
This function searches the database for potential duplicate questions and returns an array that contains questions that are potential duplicates of each other. 

There are no URL parameters except for the UID parameter used to authenticate the user. The ending format of data looks something like this:
{
  "endingQuestions": [
    [
      {
        "Species": "",
        "Resource": "",
        "Pg": "",
        "Level": null,
        "Question": "",
        "Answer": "",
        "Topic": null,
        "lastusagedate": null,
        "id": ###,
        "updated": ###,
        "lastusageevent": null
      },
      {
      }... so on and so forth for each question that is a duplicate of the one shown above
    ],
    [
    ]... so on and so forth for each group of duplicate questions
}

  https://<functionappname>.azurewebsites.net/api/AddQuestions?uid=<uid>
*/

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('DuplicateDetect', {
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
                // Fetches the top 20 questions in the database that have a duplicate question and answer.
                const duplicateReq = "SELECT TOP 20 question, answer FROM [dbo].[QuizQuestions] GROUP BY question, answer HAVING count(question) > 1 AND count(answer) > 1";
                const data = await pool.request().query(duplicateReq);

                var questions = [];
                var answers = [];

                // Randomly picks a question from the resulting data. This is done so that multiple users can get different questions.
                var randInt = Math.floor(Math.random() * data.recordset.length);

                // Adds the randomly selected question and answer to the arrays.
                questions.push(data.recordset[randInt].question);
                answers.push(data.recordset[randInt].answer);
                console.log(questions);

                // Fetches the questions that are potential duplicates of the randomly selected question and answer.
                var individualQuestionQuery = "SELECT * FROM [dbo].[QuizQuestions] WHERE question in ('" + questions.join("','") + "') AND answer in ('" + answers.join("','") + "')";
                var individualData = await pool.request().query(individualQuestionQuery);

                console.log(individualData)
                var endingQuestions = individualData.recordset;

                // Returns the questions that are potential duplicates of the randomly selected question and answer.
                return {
                    body: JSON.stringify({ endingQuestions }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                };
            } else {
                throw ("Invalid user ID provided / No user found with that ID.")
            }
        } catch (e) {
            // If an error occurs, it is logged to the console and sent to Sentry. Errors are only logged if the function is not running locally.
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
