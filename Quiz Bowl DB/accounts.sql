CREATE TABLE [dbo].[accounts] (
    [id]       INT            IDENTITY (1, 1) NOT NULL PRIMARY KEY CLUSTERED ([id] ASC),
    [username] VARCHAR (MAX)  NOT NULL,
    [password] NVARCHAR (MAX) NOT NULL
);
