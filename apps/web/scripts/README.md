# Seed Script Documentation

This document outlines the data created by the `seed.ts` script, which populates the database with initial test data.

## Organizations

| Name                | Slug                |
| ------------------- | ------------------- |
| Test Organization   | test-organization   |
| Test Organization 2 | test-organization-2 |
| Test Organization 3 | test-organization-3 |

## Projects

| Name           | Slug           | Organization        |
| -------------- | -------------- | ------------------- |
| Test Project   | test-project   | Test Organization   |
| Test Project 2 | test-project-2 | Test Organization 2 |
| Test Project 3 | test-project-3 | Test Organization 2 |
| Test Project 4 | test-project-4 | Test Organization 3 |

## Users and Memberships

| Name                  | Email                           | Role  | Organizations                                                                           |
| --------------------- | ------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| Admin User            | admin@example.com               | admin | Owner of Test Organization                                                              |
| Regular User          | user@example.com                | user  | Member of Test Organization                                                             |
| Profile Changer       | profile@example.com             | user  | Member of Test Organization                                                             |
| Email Changer         | emailchanger@example.com        | user  | Member of Test Organization                                                             |
| Avatar user           | avatar@example.com              | user  | Member of Test Organization                                                             |
| Account Deleter       | accountdeleter@example.com      | user  | Member of Test Organization                                                             |
| Account Multiple Orgs | accountmultipleorgs@example.com | user  | Admin in Test Organization, Member in Test Organization 2, Owner in Test Organization 3 |
| Account In No Org     | account-in-no-org@example.com   | user  | No memberships                                                                          |
| Admin In No Org       | admin-in-no-org@example.com     | admin | No memberships                                                                          |

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
