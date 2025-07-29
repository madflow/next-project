# Inviting Users

## Goal

Implement a feature to invite users to a multitenant application with organizations and members. Users can be invited by organization owners or admin users. The system should support two user roles (admin and user) and three member roles (admin, member, owner). There is no public signup - all users must be invited.

## Task 1: Checking valid invitations

- [x] Export the invitation model in packages/database/src/schema/index.ts
- [x] In apps/web/src/app/(auth)/auth/accept-invitation/[id]/page.tsx, implement a server check to verify if the invitation id exists in the database
- [x] If the invitation id does not exist, return the notFound function from nextjs
- [x] Run `make check` to verify implementation and fix any errors

## Task 2: Check if invitation is for existing user

- [x] In `apps/web/src/app/(auth)/auth/accept-invitation/[id]/page.tsx`, check if the invitation email corresponds to an existing user using ilike for case-insensitive email matching
- [x] If user exists, fetch the complete user object
- [x] Check if the user is already a member of the organization from the invitation
- [x] Store this information to determine if the user needs to sign up or can directly accept the invitation

## Task 3: Accepting invitations

- [x] If the user canDirectlyAccept===true, then he can accept via server: const data = await auth.api.acceptInvitation({ body: { invitationId: "invitation-id", // required }, })
- [x] Implement a new shadcn card with a button "Accept invitation"
- [x] Translate this phrase and put it in apps/web/messages for de and en. The namespace key should be authAcceptInvitation
- [x] When the button is clicked, redirect to "/"
- [x] When this can only be implemented with a client component, use const { data, error } = await authClient.organization.acceptInvitation({ invitationId: "invitation-id", // required });

## Task 4: Signing up with invitation

- [x] When the user does not exist, they can signup via the invitation
- [x] Adapt the existing signup page to handle invitations
- [x] When signing up via invitation, the email is already verified
- [x] The user's organization membership must be set after registration (use the member dal)
- [x] The user's role in the organization must be set after registration (use the member dal)
- [x] Translations go into the authAcceptInvitation namespace
- [x] Run `make check` to verify implementation and fix any errors

## Task 5: Organization select component

- [x] Create a new organization select component by adapting @apps/web/src/components/form/project-select.tsx
- [x] Create a new hook to fetch organizations from the /api/organizations endpoint
- [x] Create formOrganizationSelect translation keys in apps/web/messages for de and en
- [x] Component should be named OrganizationSelect
- [x] Use the same pattern as ProjectSelect but for organizations
- [x] Run `make check` to verify implementation and fix any errors

## Task 6: Implement Invitation Form

- [ ] Create a new form component for inviting users in `apps/web/src/components/admin/user/invite-user-form.tsx`
- [ ] Use `react-hook-form` for form handling and `zod` for validation
- [ ] Implement a role select field with options "member", "admin", "owner" (default: "member")
- [ ] Implement an organization select field using the existing `OrganizationSelect` component
- [ ] Add form submission handler that calls `authClient.organization.inviteMember()` with the form data
- [ ] Integrate the new form component into `invite-user-modal.tsx`
- [ ] Add necessary translations for form labels, placeholders, and messages
- [ ] Add form validation for required fields
- [ ] Add loading state and error handling for the invitation process
- [ ] Add success/error toasts for user feedback