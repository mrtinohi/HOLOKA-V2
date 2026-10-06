-- Run through SSMS or sqlcmd with a database-creation-capable Windows login.
-- Existing databases are retained. Do not run against an unrelated server.
USE master;
GO
IF DB_ID(N'holoka_newconcept') IS NULL
    CREATE DATABASE [holoka_newconcept] COLLATE Latin1_General_100_CI_AS_SC;
GO
IF DB_ID(N'holoka_newconcept_it') IS NULL
    CREATE DATABASE [holoka_newconcept_it] COLLATE Latin1_General_100_CI_AS_SC;
GO
