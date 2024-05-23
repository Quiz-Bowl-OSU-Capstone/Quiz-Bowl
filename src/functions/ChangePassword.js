const { app } = require('@azure/functions');
const sql = require('mssql');
const randomstring = require("randomstring");
const connString = process.env.dbconn;
const local = process.env.ignoreSentry || true;

/*
This function allows a user to change their password. The user must provide their current password, and can optionally provide a new password. 
If no new password is provided, a random password will be generated for them. If the user is an admin, they can also reset the password of any user by providing the username of the account to reset.

URL Parameters:
- uid: The user ID of the user making the request. 
- currentpass: The current password of the user.
- acctusername: (Optional) The username of the account to reset the password for. If not provided, the user is assumed to be resetting their own password.
- newpassword: (Optional) The new password to set for the account. If not provided, a random password will be generated.
*/

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('ChangePassword', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const uid = decodeURI(request.query.get('uid') || "");
            const currentpass = decodeURI(request.query.get('currentpass') || "");
            const authquery = "SELECT * FROM [dbo].[Accounts] WHERE uid='" + uid + "' AND password='" + currentpass + "'";
            const authdata = await pool.request().query(authquery);

            // If the user is authentic / exists in the database.
            if (authdata.recordset.length > 0) {
                // Get the acctusername parameter from the URL. If not provided, assume the user is resetting their own password.
                const acctusername = decodeURIComponent(request.query.get('acctusername') || authdata.recordset[0].username);
                var newpassword = decodeURIComponent(request.query.get('newpassword') || randomstring.generate({ length: 12, charset: 'alphanumeric' }));
                const acctquery = "UPDATE [dbo].[Accounts] SET password = \'" + newpassword + "\' WHERE username = \'" + acctusername + "\'";
                var acctdata;

                if (acctusername == "" || acctusername == authdata.recordset[0].username) {
                    acctdata = await pool.request().query(acctquery);
                } else {
                    // If the user is an admin, they can reset the password of any user by providing the username of the account to reset.
                    if (authdata.recordset[0].admin) {
                        acctdata = await pool.request().query(acctquery);
                    } else {
                        throw("You do not have permission to reset the password of another user.");
                    }
                }

                console.log(acctdata);
                // Return the accounts in a JSON format.
                if (acctdata.rowsAffected > 0) {
                    return { body: "{\"pass\": \"" + newpassword + "\"}", headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }};
                } else {
                    throw("Failed to find account!");
                }
            } else {
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
