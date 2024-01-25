const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = "Server = osuquizbowldb.database.windows.net,1433;Initial Catalog = quizbowldb;Persist Security Info = False;User ID = qzbowladmin; Password = tvHf37hYkVhQ; MultipleActiveResultSets = False; Encrypt = True; TrustServerCertificate = False;Connection Timeout = 30";

// Later on, these parameters will be passed into the API when it is called, but for demo purposes they are set here.
var question = "Do hippos exist?" + ", ";
var answers = "Yes" + ", ";
var difficulty = "1" + ", ";
var topic = "Hippos" + ", ";
var species = "Hippo" + ", ";
var resource = "hipposdoexist.com" + ", ";
var lastUpdated = "2023-09-12";

app.http('AddQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);

        var queryText = "INSERT INTO [dbo].[QuizQuestions] (Species, Resource, Level, Question, Answer, Topic, Entered_Updated) VALUES (" + species + resource + difficulty + question + answers + topic + lastUpdated + ")";
        console.log(queryText);

        const data = await pool.request().query(queryText);

        context.res = {
            body: data
        };
    }
});
