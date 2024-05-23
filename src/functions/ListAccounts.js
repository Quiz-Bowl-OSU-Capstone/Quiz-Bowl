const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

// This function will fetch a list of all accounts in the database. This is used for administrative purposes.
// This function requires a uid of an admin user to run, and will only return usernames and admin status.

// URL Parameters:
// - uid: The user ID of the user making the request. This is used to authenticate the user and ensure that they have the correct permissions to make the request.

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('ListAccounts', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const uid = decodeURI(request.query.get('uid') || "");
            const currentpass = decodeURI(request.query.get('currentpass') || "");
            const authquery = "SELECT * FROM [dbo].[Accounts] WHERE uid='" + uid + "' AND password='" + currentpass + "'";
            const authdata = await pool.request().query(authquery);

            // If the user is authentic / exists in the database, and is an admin.
            if (authdata.recordset.length > 0 && authdata.recordset[0].admin) {

                // Fetch the list of accounts from the database. Only retrieves username and admin status.
                const data = await pool.request().query("SELECT username,admin FROM [dbo].[Accounts]");
            
                // Return the accounts in a JSON format.
                return { body: "{\"accounts\":" + JSON.stringify(data.recordset) + "}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }};
            } else {
                console.log(authdata.recordset[0]);
                throw("Invalid user ID provided / No user found with that ID.")
            }
        } catch (e) {
            // If an error occurs, log the error and return the error message to the user. Only runs if not in a local environment.
            if (!local) {
                Sentry.withScope((scope) => {
                    scope.setSDKProcessingMetadata({ request: request });
                    Sentry.captureException(e);
                })
                console.log(e);
                await Sentry.flush(2000);
            }

            // Return the error message to the user.
            return { body: "{\"Error\":\"" + e + "\"}", headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }};
        }
    }
});
