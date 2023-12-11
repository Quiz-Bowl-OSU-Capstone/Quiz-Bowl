/* Lists all questions currently in the database in the form of an array of JSON objects. */
const sql = require('mssql')

const connString = process.env['dbconn'];

module.exports = async function (context, req) {    
    const pool = await sql.connect(connString);    

    const data = await pool.request().query("SELECT * FROM questions");

    context.res = {        
        body: data.recordset
    };
}