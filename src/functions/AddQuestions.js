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
      "resource": "resource"
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
        if (authdata.recordset.length > 0) {
          var questions = JSON.parse(decodeURIComponent(request.query.get('questions')));
          var lastupdated = new Date().toJSON();
  
          if (questions.questions != undefined && questions.questions.length > 0) {
              var rowsAffected = 0;
              for (i = 0; i < questions.questions.length; i++) {
                  var queryText = "INSERT INTO [dbo].[QuizQuestions] (Species, Resource, Level, Question, Answer, Topic, updated) VALUES ('"
                       + questions.questions[i].species + "', '" 
                       + questions.questions[i].resource + "', '"
                       + questions.questions[i].level + "', '"
                       + questions.questions[i].question + "', '" 
                       + questions.questions[i].answer + "', '" 
                       + questions.questions[i].topic + "', '" 
                       + lastupdated + "')";
                  var data = await pool.request().query(queryText);
                  rowsAffected += data.rowsAffected[0];
              }
          }
          
          return { body: "{\"questionsAdded\":" + rowsAffected + "}", headers: {
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

        return { // Always returns a consistent error msg.
          body: "{\"Error\":\"" + e + "\"}", 
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
        };
      }
    }
});
