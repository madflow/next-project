# User Invitation Feature Specification

## Introduction

This specification outlines the implementation of a user invitation feature for the Next.js application. The feature will allow administrators to invite new users to join their organization through a modal interface that captures the invitee's email address and sends an invitation.

## Task List

1. **Create InviteUserModal Component**
   - Build a client-side modal component for user invitation
   - Include email input field with validation
   - Add form submission handling
   - Implement loading and error states

2. **Integrate Modal with Members Page**
   - Add "Invite User" button to the members page
   - Implement modal open/close functionality
   - Ensure proper state management between parent and modal

3. **Implement Invitation Logic**
   - Use the provided `authClient.organization.inviteMember` API
   - Handle successful invitations with user feedback
   - Manage error scenarios with appropriate messaging

4. **Add Form Validation**
   - Validate email format before submission
   - Provide clear error messages for invalid inputs
   - Prevent duplicate submissions during processing

5. **Update Members Page UI**
   - Position the invite button appropriately within the existing layout
   - Ensure consistent styling with the current design system
   - Handle modal backdrop and focus management

## Implementation Details

### Target File
- **Location**: `apps/web/src/app/(admin)/admin/organizations/[id]/members/page.tsx`
- **New Component**: `InviteUserModal` (client component)

### API Integration
```javascript
const { data, error } = await authClient.organization.inviteMember({
    email: "example@gmail.com", // required
    role: "member", // required
    organizationId: organizationId,
    resend: true,
});
```

### Component Requirements
- Modal must be a client component (`"use client"`)
- Email input with proper validation
- Submit button with loading state
- Cancel/close functionality
- Error handling and display

## Acceptance Criteria

### Functional Requirements
- [ ] "Invite User" button is visible on the members page
- [ ] Clicking the button opens a modal with email input field
- [ ] Email validation prevents invalid email submissions
- [ ] Valid email submissions trigger the invite API call
- [ ] Successful invitations show confirmation message and close modal
- [ ] Failed invitations display appropriate error messages
- [ ] Modal can be closed via cancel button, backdrop click, or ESC key
- [ ] Loading states prevent multiple simultaneous submissions

### Technical Requirements
- [ ] InviteUserModal is implemented as a client component
- [ ] Modal integrates properly with existing members page layout
- [ ] API calls use the specified `authClient.organization.inviteMember` method
- [ ] Organization ID is properly passed from the page context
- [ ] Component follows existing code patterns and styling conventions

### User Experience Requirements
- [ ] Modal appears with smooth animation
- [ ] Form validation provides immediate feedback
- [ ] Success and error states are clearly communicated
- [ ] Interface remains responsive during API calls
- [ ] Modal closes automatically after successful invitation
- [ ] Focus management follows accessibility best practices