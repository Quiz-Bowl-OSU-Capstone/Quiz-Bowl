CREATE TABLE [dbo].[questions] (
    [Id]                INT           IDENTITY (1, 1) NOT NULL PRIMARY KEY CLUSTERED ([Id] ASC),
    [question]          VARCHAR (MAX) NOT NULL,
    [answers]           VARCHAR (MAX) NOT NULL,
    [category]          CHAR (64)     NOT NULL,
    [difficulty]        INT           NOT NULL,
    [lastusagedate]     DATE          NULL,
    [lastusagelocation] CHAR (64)     NULL
);
