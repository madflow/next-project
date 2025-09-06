# Seed Script Documentation

This document outlines the data created by the `seed.ts` script, which populates the database with initial test data.

## Organizations

| Name                | Slug                | UUID                                 |
| ------------------- | ------------------- | ------------------------------------ |
| Test Organization   | test-organization   | 0198e5a9-39c8-70db-9c7d-e11ab6d9aea7 |
| Test Organization 2 | test-organization-2 | 0198e5a9-0dac-7b95-a7a5-c9aa87a7f5c4 |
| Test Organization 3 | test-organization-3 | 0198e5a9-66f2-7391-ba86-1c7ae2127625 |

## Projects

| Name           | Slug           | Organization        | UUID                                 |
| -------------- | -------------- | ------------------- | ------------------------------------ |
| Test Project   | test-project   | Test Organization   | 0198e5a9-a975-7ac3-9eec-a70e2a3df131 |
| Test Project 2 | test-project-2 | Test Organization 2 | 0198e5ac-2685-7e65-9308-5c8c249eea09 |
| Test Project 3 | test-project-3 | Test Organization 2 | 0198e5ac-510d-78b1-bc34-3a5e24ec7788 |
| Test Project 4 | test-project-4 | Test Organization 3 | 0198e5ac-7a6c-7d0c-bedd-6a74ff7bfe59 |

## Datasets

| Name           | Organization        | Project        | UUID                                 |
| -------------- | ------------------- | -------------- | ------------------------------------ |
| Test Dataset   | Test Organization   | Test Project   | 0198e639-3e96-734b-b0db-af0c4350a2c4 |
| Test Dataset 2 | Test Organization 3 | Test Project 4 | 0198e639-3e96-734b-b0db-af0c4350a2c5 |

## Users and Memberships

| Name                  | Email                           | Role  | UUID                                 | Organizations                                                                           |
| --------------------- | ------------------------------- | ----- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Admin User            | admin@example.com               | admin | 0198e599-eab0-7cb8-861f-72a8f6d7abb1 | Owner of Test Organization                                                              |
| Regular User          | user@example.com                | user  | 0198e59c-e576-78d2-8606-61f0275aca5a | Member of Test Organization                                                             |
| Profile Changer       | profile@example.com             | user  | 0198e59e-c1c6-7c10-b6a4-c29b7f74a776 | Member of Test Organization                                                             |
| Email Changer         | emailchanger@example.com        | user  | 0198e59f-0edd-7a89-9e7b-cf0460bc9efd | Member of Test Organization                                                             |
| Avatar user           | avatar@example.com              | user  | 0198e5a0-1cd3-78a5-9230-f4807fa7cb59 | Member of Test Organization                                                             |
| Account Deleter       | accountdeleter@example.com      | user  | 0198e5a1-839c-7421-9c3a-f7b8a6f7c32e | Member of Test Organization                                                             |
| Account Multiple Orgs | accountmultipleorgs@example.com | user  | 0198e5a0-66da-7e75-9dad-25c85825821a | Admin in Test Organization, Member in Test Organization 2, Owner in Test Organization 3 |
| Account In No Org     | account-in-no-org@example.com   | user  | 0198e5a5-3095-7924-8da5-2b8b4562f759 | No memberships                                                                          |
| Admin In No Org       | admin-in-no-org@example.com     | admin | 0198e5a6-66eb-7351-b25b-df1a50bc53fa | No memberships                                                                          |

## Default Credentials

All seed users have the same password for testing purposes:

- **Password**: Tester12345

## Updating This Documentation

To update this documentation using AI assistance, provide the following prompt to your AI assistant:

```
Please update the README.md documentation for the seed script based on the current seed.ts file.
The documentation should include:
1. All organizations with their slugs
2. All projects with their slugs and parent organizations
3. All users with their emails, roles, and organization memberships
4. Any default credentials
5. Any important notes about the seed data

Format the information in clear markdown tables similar to the existing documentation.
```

## Notes

- The script first truncates all existing data in the relevant tables before creating new seed data.
- All users have their email verified by default.
- The script includes users with various roles and organization memberships to test different access levels.
- Some users are specifically created for testing specific features (profile changes, email changes, etc.).
- The UUIDs for users, organizations, and projects are hardcoded for testing purposes.
