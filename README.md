# Quiz Bowl Capstone Repository
### Description
This repository contains the Azure Functions code for the Quiz Bowl API, a crucial part of the Quiz Bowl project. The code in this repository is the same code as is in the "qzblapi" Function App in the Azure Portal. Any deployments made to the main branch will automatically redeploy on the qzblapi app (AKA PRODUCTION) on the Azure platform.

### File Structure & Pre-Requisites
This entire repository contains a single Functions app. The src folder contains all of the individual Functions that are part of this app.

This app requires various dependencies in order to run locally. These can be installed by running "npm install" in this directory. You will also need to install the Azure Functions Core Tools package. [You can install Azure Functions Core Tools here](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?programming-language-javascript).

### Accessing The Database
The database is accessed via the cloud for development purposes. All functions take a connection string as input in order to connect to the database. 

### Using This Repository
To use this repository, the following commands can be run from the repository folder:

#### func new --template "Http Trigger" --name 'name here'
Creates a new function inside of this application. Select Node for runtime and Javascript for language.

#### func start
Runs the function app locally for testing.

#### Other functions
For full information, check out the [Azure Functions Core Tools Dev Reference](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?programming-language-javascript)