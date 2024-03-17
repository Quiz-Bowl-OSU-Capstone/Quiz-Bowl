const { app } = require('@azure/functions');
const sql = require('mssql');
const connString = process.env.dbconn;

/*
This function will fetch all unique values for the species, resource, level, and topic fields from the database and return them as a JSON object.

Note that all API functions require an additional parameter, "uid", which is the user ID of the user making the request. 
This is used to authenticate the user and ensure that they have the correct permissions to make the request.
*/

"use strict";

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fd74455ce2266338039fbb110857742a@o4506871436607488.ingest.us.sentry.io/4506871438639104",
});

app.http('SearchFilters', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(connString);
            const uid = decodeURI(request.query.get('uid') || "");
            const authquery = "SELECT * FROM [dbo].[Accounts] WHERE uid='" + uid + "'";
            const authdata = await pool.request().query(authquery);
            if (authdata.recordset.length > 0) {
                const filters = {
                    species: ["\"\""],
                    resource: ["\"\""],
                    level: ["\"\""],
                    topic: ["\"\""]
                }
        
                const data = await pool.request().query("SELECT DISTINCT Species, Resource, Level, Topic FROM [dbo].[QuizQuestions]");
        
                currentFilters = Object.create(filters);
                for (i = 0; i < data.recordset.length; i++) {
                    if (currentFilters.species.indexOf("\"" + data.recordset[i].Species + "\"") < 0) {
                        if (data.recordset[i].Species != "" && data.recordset[i].Species != null) {
                            currentFilters.species.push("\"" + data.recordset[i].Species + "\"");
                        }
                    }
        
                    if (currentFilters.resource.indexOf("\"" + data.recordset[i].Resource + "\"") < 0) {
                        if (data.recordset[i].Resource != "" && data.recordset[i].Resource != null) {
                            currentFilters.resource.push("\"" + data.recordset[i].Resource + "\"");
                        }
                    }
        
                    if (currentFilters.level.indexOf("\"" + data.recordset[i].Level + "\"") < 0) {
                        if (data.recordset[i].Level != "" && data.recordset[i].Level != null) {
                            currentFilters.level.push("\"" + data.recordset[i].Level + "\"");
                        }
                    }
        
                    if (currentFilters.topic.indexOf("\"" + data.recordset[i].Topic + "\"") < 0) {
                        if (data.recordset[i].Topic != "" && data.recordset[i].Topic != null) {
                            currentFilters.topic.push("\"" + data.recordset[i].Topic + "\"");
                        }
                    }
                }
        
                resString = "{ \"Species\": [" + currentFilters.species.sort() + "], \"Resource\":[" + currentFilters.resource.sort() + "], \"Level\":[" + currentFilters.level.sort() + "], \"Topic\":[" + currentFilters.topic.sort() + "]}"
        
                return { body: resString, headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }} ;
            } else {
                throw("Invalid user ID provided / No user found with that ID.")
            }
        } catch (e) {
            Sentry.withScope((scope) => {
            scope.setSDKProcessingMetadata({ request: request });
            Sentry.captureException(e);
            })
            console.log(e);
            await Sentry.flush(2000);
            return { body: "{\"Error\":\"" + e + "\"}", headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }};
        }
    }
});
