const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

// Will check if an account exists in the database and return the account details if it does, or return an error if not.

// URL Parameters:
// - username: The username of the account.
// - password: The password for the account.

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('ValidAccount', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const user = decodeURI(request.query.get('username'));
            const pass = decodeURI(request.query.get('password'));
            const query = "SELECT * FROM [dbo].[Accounts] WHERE username=N'" + user + "' AND password=N'" + pass + "'"

            const data = await pool.request().query(query);

            if (data.recordset.length == 1) {
                if (data.recordset[0].username == user && data.recordset[0].password == pass) {
                    data.recordset[0].password = "*";
                    return { body: JSON.stringify(data.recordset[0]), headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }} ;
                } else {
                    throw("No account found for this information!");
                }
            } else if (data.recordset.length > 1){
                throw("Multiple accounts found for this information!");
            } else {
                throw("No account found for this information!");
            }
        } catch (e) {
            Sentry.withScope((scope) => {
            scope.setSDKProcessingMetadata({ request: request });
            Sentry.captureException(e);
            })
            console.log(e);
            await Sentry.flush(2000);
            return { body: "{\"Error\":\"" + e + "\",\"uid\":-1}", headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }};
        }
    }
});
