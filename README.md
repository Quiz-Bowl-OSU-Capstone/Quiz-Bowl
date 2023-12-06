# Quiz Bowl Capstone Repository
### Description
This is the official repository for the Quiz Bowl program for CS capstone 2023-2024.

### File Structure
- src: Source files, program files.
- docs: Documentation about the Quiz Bowl program.
- license: This program is licensed with the MIT software license.
- README - this file.

## Required Software Installation Instructions
For the backend server to run locally, you must install and work with Azure Data Studio.

1. Download/install Azure Data Studio here: https://learn.microsoft.com/en-us/azure-data-studio/download-azure-data-studio. 

2. Download the required software for Azure SQL Database here: https://learn.microsoft.com/en-us/azure/azure-sql/database/local-dev-experience-set-up-dev-environment. This includes Docker Desktop, and if you are using Windows, Windows Subsystem for Linux. You'll also want to follow the instructions to install the SQL Database Projects extension, located in the "Install extension" section.

## Open The Database Project Locally
This guide assumes that you already have either downloaded the project files located in this repository or you have cloned the repository to your local machine using the GitHub application. If you have not done so, download a copy of the repository to your local machine and store it somewhere safe.

1. Open Azure Data Studio and click on the "Database Projects" tab on the left side.

2. Click "Open existing project". In the tab that opens, make sure location is set to "Local" and for the Project file field, navigate to the folder you stored the repository files in and click "Quiz Bowl DB.sqlproj"

## Run The Database Locally
1. If you are not already on the "Database Projects" page, click on the "Database Projects" tab on the left side.

2. In the small section directly underneath where it says "Database Projects" (next to the + symbol), right click on the project name ("Quiz Bowl DB").

3. Click "Build". The database will check to see if any errors are found. If none are found, you are good to proceed!

4. Right click on the project name again ("Quiz Bowl DB") and click on "Publish".

5. For the "Publish Target" section, select "Publish to new Azure SQL server local development container"

6. Change the port and server admin password fields to whatever you wish, and accept the terms and conditions.

7. Click "Publish".

Note that this will create and start a Docker container running locally on your machine that contains the database. This container does not have a web or graphical interface - you will only be able to use the database by connecting to it with an SQL client and running commands through that. I would recommend something like DBeaver: https://dbeaver.io/