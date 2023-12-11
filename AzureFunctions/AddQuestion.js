/* Lists all questions currently in the database in the form of an array of JSON objects. */
const sql = require('mssql')

const connString = process.env['dbconn'];

// Later on, these parameters will be passed into the API when it is called, but for demo purposes they are set here.
var question = "Do hippos exist?" + ", ";
var answers = "Yes" + ", ";
var difficulty = "1" + ", ";
var topic = "Hippos" + ", ";
var species = "Hippo" + ", ";
var resource = "hipposdoexist.com" + ", ";
var lastUpdated = "2023-09-12";

module.exports = async function (context, req) {
   const pool = await sql.connect(connString);

   const data = await pool.request().query("INSERT INTO questions (question, answers, difficulty, topic, species, resource, lastUpdated) VALUES (" + question + answers + difficulty + topic + species + resource + lastUpdated);

   context.res = {
      body: data
   };
}