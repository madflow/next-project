# Invite Users Feature Specification

## Introduction

This specification outlines the implementation of a user invitation feature for the Next.js application. The feature will allow administrators to invite new users to organizations through a modal interface that collects email addresses and sends invitations.

## Task List

1. **Create Invite Modal Component**
   - Create a new client component for the invitation modal
   - Include email input field with validation
   - Add invite button and cancel/close functionality
   - Implement proper form handling and submission

2. **Integrate Modal with Members Page**
   - Add "Invite User" button to the members page
   - Connect button to open the invitation modal
   - Ensure modal opens and closes properly

3. **Implement Invitation Logic**
   - Use the provided `authClient.organization.inviteMember` method
   - Handle form submission with email validation
   - Set role to "member" and resend to true
   - Use organizationId from the page parameters

4. **Add User Feedback**
   - Show loading state during invitation process
   - Display success message on successful invitation
   - Handle and display error messages appropriately
   - Close modal after successful invitation

5. **Style the Components**
   - Ensure modal follows existing design patterns
   - Make the interface responsive and accessible
   - Style the invite button to match existing UI

## Implementation Details

### Target File
- `apps/web/src/app/(admin)/admin/organizations/[id]/members/page.tsx`

### API Usage
```javascript
const { data, error } = await authClient.organization.inviteMember({
    email: "example@gmail.com", // required
    role: "member", // required
    organizationId: organizationId,
    resend: true,
});
```

### Component Requirements
- Modal component must be a client component
- Form should validate email format before submission
- Handle organizationId from page parameters
- Proper error handling and user feedback

## Acceptance Criteria

- [ ] "Invite User" button is visible on the members page
- [ ] Clicking the button opens a modal with email input field
- [ ] Modal can be closed using cancel button or close icon
- [ ] Email field has proper validation (required, valid email format)
- [ ] Submitting valid email triggers the invite API call
- [ ] Loading state is shown during API call
- [ ] Success message appears after successful invitation
- [ ] Error messages are displayed for failed invitations
- [ ] Modal closes automatically after successful invitation
- [ ] Component follows existing design patterns and styling
- [ ] Modal is responsive and accessible
- [ ] No existing functionality is broken or removed