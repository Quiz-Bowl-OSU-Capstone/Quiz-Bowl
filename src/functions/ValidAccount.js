const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

// Will check if an account exists in the database and return the account details if it does, or return an error if not.

// URL Parameters:
// - username: The username of the account.
// - password: The password for the account.

app.http('ValidAccount', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const pool = await sql.connect(connString);
        const user = request.query.get('username');
        const pass = request.query.get('password');
        const query = "SELECT * FROM [dbo].[Accounts] WHERE username=N'" + user + "' AND password=N'" + pass + "'"

        const data = await pool.request().query(query);

        if (data.recordset.length == 1) {
            return { body: JSON.stringify(data.recordset[0]) };
        } else if (data.recordset.length > 1){
            return { body: `{"username":"Multiple accounts found with the same information. This is a data error.", "userID":"0"}` };
        } else {
            return { body: `{"username":"No account was found for the provided information.", "userID":"0"}` };
        }
    }
});
