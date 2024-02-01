const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

// Will add a question to the database. All parameters listed below are required and need to be encoded in URI format using encodeURI(). The lastupdate parameter needs to be decodable in date-time format.

// URL Parameters:
// - qst: STRING - The question.
// - ans: STRING - The answer.
// - diff: INT - The difficulty of the question.
// - topic: STRING - The question topic.
// - species: STRING - The species of the question.
// - resource: STRING - The location the question came from.

app.http('AddQuestions', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);

        const question = decodeURI(request.query.get('qst'));
        const answer = decodeURI(request.query.get('ans'));
        const difficulty = decodeURI(request.query.get('diff'));
        const topic = decodeURI(request.query.get('topic'));
        const species = decodeURI(request.query.get('species'));
        const resource = decodeURI(request.query.get('resource'));
        
        // lastupdated is automatically set to UTC -8, or PST.
        var lastupdated = new Date(Date.now() - (1000*60*60*8)).toJSON();
        var data;

        if (
            question != null &&
            answer != null &&
            difficulty != null &&
            topic != null &&
            species != null &&
            resource != null &&
            lastupdated != null
        ){
            var queryText = "INSERT INTO [dbo].[QuizQuestions] (Species, Resource, Level, Question, Answer, Topic, updated) VALUES ('" + species + "', '" + resource + "', " + difficulty + ", '" + question + "', '" + answer + "', '" + topic + "', '" + lastupdated + "')";
            console.log(queryText);

            data = await pool.request().query(queryText);

            context.res = {
                body: data
            };
        } else {
            data = "Error: One or more required parameters is missing. Check and try again."
        }
        return { body: JSON.stringify(data) };
    }
});
