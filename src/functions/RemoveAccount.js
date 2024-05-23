const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

// This function removes a given account from the database. This is used for administrative purposes. The user running this function must be an admin regardless
// of which account they are trying to delete. 

// URL Parameters:
// - uid: The user ID of the user making the request. This is used to authenticate the user and ensure that they have the correct permissions to make the request.
// - currentpass: The current password of the user. This is used to authenticate the user and ensure that they have the correct permissions to make the request.
// - username: The username of the account to delete. This is required to delete the account.

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('RemoveAccount', {
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
                // Form and run the query to delete all accounts that match the username given.
                var querystring = "DELETE FROM [dbo].[Accounts] WHERE username='" + decodeURIComponent(request.query.get('username') || "") + "'";
                const data = await pool.request().query(querystring);
            
                // Return the number of deleted accounts in a JSON format.
                return { body: "{\"deleted\":" + data.rowsAffected + "}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }};
            } else {
                // Invalid ID or not an admin.
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
