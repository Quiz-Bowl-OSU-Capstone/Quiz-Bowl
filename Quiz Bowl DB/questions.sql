CREATE TABLE [dbo].[questions] (
    [Id]             INT           IDENTITY (1, 1) NOT NULL PRIMARY KEY CLUSTERED ([Id] ASC),
    [question]       VARCHAR (MAX) NOT NULL,
    [answers]        VARCHAR (MAX) NOT NULL,
    [difficulty]     INT           NOT NULL,
    [topic]          VARCHAR (50)  NOT NULL,
    [species]        VARCHAR (50)  NOT NULL,
    [resource]       VARCHAR (50)  NOT NULL,
    [pageNum]        INT           NULL,
    [lastUsageDate]  DATE          NULL,
    [lastUsageEvent] VARCHAR (50)  NULL,
    [lastUpdated]    INT           NOT NULL
);
