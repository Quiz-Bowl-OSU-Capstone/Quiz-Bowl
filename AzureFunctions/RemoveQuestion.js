/* Deletes a given question using the provided ID number. */
const sql = require('mssql')

const connString = process.env['dbconn'];

module.exports = async function (context, req) {
   const pool = await sql.connect(connString);

   // Later on, these parameters will be passed into the API when it is called, but for demo purposes they are set here.
   var target = 3;

   const data = await pool.request().query("DELETE FROM questions WHERE id = " + target);

   context.res = {
      body: data
   };
}