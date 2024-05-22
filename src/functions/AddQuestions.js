const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

/* 
This function accepts multiple questions to add to the database. Questions must be formatted inside of an array of JSON objects, with the following required properties:
 - question: STRING - The question to add.
 - answer: STRING - The answer to the question.
 - topic: STRING - The topic of the question.
 - level: STRING - The difficulty level of the question.
 - species: STRING - The species the question is about.
 - resource: STRING - The resource the question is about.

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
      "lastused": "2021-01-01T00:00:00.000Z",
      "lastevent": "event"
    },
    {
      ... so on and so forth...
    }
  ]
}

Make sure to encode the JSON object as a URI component before sending it to the function using:

  encodeURIComponent(JSON.stringify()).

Note that all API functions require an additional parameter, "uid", which is the user ID of the user making the request. 
This is used to authenticate the user and ensure that they have the correct permissions to make the request. This means your final URL will look something like this:

  https://<functionappname>.azurewebsites.net/api/AddQuestions?uid=<uid>&questions=<questions>
*/

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('AddQuestions', {
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
          var questions = JSON.parse(decodeURIComponent(request.query.get('questions')));
          var lastupdated = new Date().toJSON();
  
          // If the questions array is defined and has at least one question.
          if (questions.questions != undefined && questions.questions.length > 0) {
              var rowsAffected = 0;
              var lastused = "";
              var lastevent = "";

              // Loops through each question in the array.
              for (i = 0; i < questions.questions.length; i++) {
                // console.log(questions.questions[i]); - for debug purposes

                // If the question has a last used date and event, set them to the variables. Otherwise, leave them blank.
                if (questions.questions[i].lastused != undefined && questions.questions[i].lastused != "") {
                  if (questions.questions[i].lastevent != undefined && questions.questions[i].lastevent != "") {
                    lastused = "'" + questions.questions[i].lastused + "'";
                    lastevent = "'" + questions.questions[i].lastevent.trim() + "'";
                    console.log("Last used and last event are defined");
                  } else {
                    lastused = "'" + questions.questions[i].lastused + "'";
                    lastevent = "NULL";
                    console.log("Last used was defined but event was not");
                  }
                } else {
                  lastused = "NULL";
                  lastevent = "NULL";
                  console.log("None were defined");
                }

                // Formatting the query statement to insert the question into the database.
                queryText = "INSERT INTO [dbo].[QuizQuestions] (Species, Resource, Level, Question, Answer, Topic, lastusagedate, lastusageevent, updated) VALUES ('"
                + questions.questions[i].species.trim().toUpperCase() + "', '" 
                + questions.questions[i].resource.trim().toUpperCase() + "', '"
                + questions.questions[i].level.trim().toUpperCase() + "', '"
                + questions.questions[i].question.trim() + "', '" 
                + questions.questions[i].answer.trim() + "', '" 
                + questions.questions[i].topic.trim().toUpperCase() + "', " 
                + lastused + ", "
                + lastevent + ", '"
                + lastupdated + "')";

                // console.log(queryText) - for debug purposes
                  
                var data = await pool.request().query(queryText);
                rowsAffected += data.rowsAffected[0];
              }
          }
          
          // Returns the wuestions that were added to the database.
          return { body: "{\"questionsAdded\":" + rowsAffected + "}", headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
          }};
        } else {
            throw("Invalid user ID provided / No user found with that ID.")
        } 
      } catch (e) {
        // Quizbowl uses Sentry monitoring to track errors in the code. This will send the error to Sentry if it is not running locally (i.e. in a production environment.)
        if (!local) {
          Sentry.withScope((scope) => {
            scope.setSDKProcessingMetadata({ request: request });
            Sentry.captureException(e);
          })
          console.log(e);
          await Sentry.flush(2000);
        }

        return { // Always returns an error message.
          body: "{\"Error\":\"" + e + "\"}", 
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
        };
      }
    }
});
