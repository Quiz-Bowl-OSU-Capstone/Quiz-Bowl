const { app } = require('@azure/functions');
const sql = require('mssql');
const randomstring = require("randomstring");
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

// This function can be used to create accounts in the database. This is used for administrative purposes. Any user running this function must be an admin.

// URL Parameters:
// - uid: The user ID of the user making the request. This is used to authenticate the user and ensure that they have the correct permissions to make the request.
// - currentpass: The current password of the user. This is used to authenticate the user and ensure that they have the correct permissions to make the request.
// - username: The username of the account to create. This is required to create the account.
// - password: (Optional) The password of the account to create. If not provided, a random password will be generated.
// - admin: (Optional) A boolean value indicating whether the account should be an admin. If you want an account to be admin, add &admin=true to your query string.
//                      If not provided, the account will not be an admin.

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('AddAccount', {
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
                // Get the new username. This is required, so if it isn't present, just throw an exception.
                const newusername = decodeURIComponent(request.query.get('username') || "");
                if (newusername == "") {
                    throw("You need a provide a username!");
                }

                // Get the  new password. If not provided, generate a random password. Also get the admin status.
                const newpassword = decodeURIComponent(request.query.get('password') || randomstring.generate({ length: 12, charset: 'alphanumeric' }));
                const admin = decodeURIComponent(request.query.get('admin') || false);

                // Insert the new account data into the database.
                const data = await pool.request().query("INSERT INTO [dbo].[Accounts] (username, password, admin) VALUES ('" + newusername + "', '" + newpassword + "', '" + admin + "')");
            
                // Return the account login information in a JSON format.
                return { body: "{\"username\":'" + newusername + "', 'password':'" + newpassword + "'}", headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }};
            } else {
                // Invalid login - was not correct ID or not an admin.
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
