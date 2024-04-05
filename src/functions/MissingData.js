const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('MissingData', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const uid = decodeURI(request.query.get('uid') || "");
            const authquery = "SELECT * FROM [dbo].[Accounts] WHERE uid='" + uid + "'";
            const authdata = await pool.request().query(authquery);
            if (authdata.recordset.length > 0) {
                const amount = parseInt(decodeURI(request.query.get('amt') || 12));
                const data = await pool.request().query("SELECT TOP " + amount + " * FROM [dbo].[QuizQuestions] WHERE Species IS NULL OR Resource IS NULL OR Level IS NULL OR Question IS NULL OR Answer IS NULL OR Topic IS NULL");

                return {
                    body: "{\"questions\":" + JSON.stringify(data.recordset) + "}", headers: {
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

            return {
                body: "{\"Error\":\"" + e + "\"}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            };
        }
    }
});
