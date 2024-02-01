const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

app.http('LastUsage', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('JavaScript HTTP trigger function processed a request.');

        // parse request body to get the question , place, and datetime
        const {question, date, time} = request.body;
        const placeDateTime = `${date} - ${time}`;

        //connect to the sql server
        await sql.connect(connString);

        // define a sql query to update the last usage place and datetime for the question
        const query = `
        UPDATE QuizQuestions
        SET Usage_date_time = @placeDateTime
        WHERE Question = @question`;

        const result = await sql.query(query, {
            question: question,
            placeDateTime: placeDateTime
        });

        await sql.close();
        
        // const name = (req.query.name || (req.body && req.body.name));
        // const responseMessage = name
        //     ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        //     : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: responseMessage
        };
    }
});
