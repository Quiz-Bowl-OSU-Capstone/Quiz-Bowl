/* Picks one random question from the database and returns it as a JSON object. */
const sql = require('mssql')

const connString = process.env['dbconn'];

module.exports = async function (context, req) {
   const pool = await sql.connect(connString);

   const data = await pool.request().query("SELECT * FROM questions");
   var randNum = Math.floor(Math.random() * data.recordset.length);

   context.res = {
      body: data.recordset[randNum]
   };
}