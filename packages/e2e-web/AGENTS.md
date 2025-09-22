# E2E Testing with Playwright

## Overview

This package contains end-to-end tests for the web application using Playwright. The tests verify user flows, UI interactions, and data persistence across the entire application stack.

## Test Structure

### Test Organization

- `tests/` - All test files (`.spec.ts` files)
- `testdata/` - Test data files (SPSS files, fixtures)
- `config.ts` - Test configuration and environment setup
- `utils.ts` - Shared test utilities and helpers
- `playwright.config.ts` - Playwright configuration

### Test Categories

- **Admin Tests**: User management, organization management, dataset management
- **API Access Tests**: Testing API endpoints and permissions
- **Authentication Tests**: Login, logout, password reset flows
- **Dataset Tests**: Upload, processing, analysis workflows
- **User Interface Tests**: Navigation, forms, responsive design

## Running Tests

### Prerequisites

1. **Web application must be running**: `http://localhost:3000`
2. **Database must be running**: PostgreSQL via Docker Compose
3. **Test environment**: Configured in `config.ts`

#### Checking Development Server Status

**Always verify the dev server is running before starting tests:**

```bash
# Check if the web app is accessible
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ Server is running" || echo "❌ Server is not running"

# Alternative check to see what's running on port 3000
lsof -i :3000

# Or using netstat
netstat -an | grep :3000
```

#### Starting the Development Server (if needed)

**Only start if the server is not already running:**

```bash
# From project root - start the development environment
make dev
```

**Important**: 
- Do not start multiple dev server instances on port 3000
- Always check server status before attempting to start
- The dev server must be running outside of Docker for tests to work properly

### Basic Commands

```bash
# From project root
pnpm --filter e2e-web exec playwright test

# Run specific test file
pnpm --filter e2e-web exec playwright test tests/admin-users.spec.ts

# Run tests in headed mode (visible browser)
pnpm --filter e2e-web exec playwright test --headed

# Run tests with debug mode
pnpm --filter e2e-web exec playwright test --debug

# Run tests in UI mode (interactive)
pnpm --filter e2e-web exec playwright test --ui

# Run tests for specific browser
pnpm --filter e2e-web exec playwright test --project=chromium
```

### Advanced Options

```bash
# Run tests with specific grep pattern
pnpm --filter e2e-web exec playwright test --grep "admin users"

# Run tests with retries
pnpm --filter e2e-web exec playwright test --retries=2

# Run tests with specific workers
pnpm --filter e2e-web exec playwright test --workers=2

# Generate test report
pnpm --filter e2e-web exec playwright show-report
```

## Playwright MCP Integration

### Navigation and Page Interaction

**Basic Navigation:**
```javascript
// Navigate to the web application
playwright_browser_navigate("http://localhost:3000")

// Take a snapshot to understand page structure
playwright_browser_snapshot()

// Navigate to specific admin page
playwright_browser_navigate("http://localhost:3000/admin/users")
```

**Element Interaction:**
```javascript
// Click on elements
playwright_browser_click({
  element: "Login button", 
  ref: "button[type='submit']"
})

// Fill form fields
playwright_browser_fill_form([
  {
    name: "email", 
    type: "textbox", 
    ref: "input[name='email']", 
    value: "admin@example.com"
  },
  {
    name: "password", 
    type: "textbox", 
    ref: "input[name='password']", 
    value: "Tester12345"
  }
])

// Type in specific elements
playwright_browser_type({
  element: "Search input",
  ref: "input[placeholder='Search...']",
  text: "test query"
})
```

### Authentication Testing

**Login Flow:**
```javascript
// Navigate to login page
playwright_browser_navigate("http://localhost:3000/auth/login")

// Fill login form
playwright_browser_fill_form([
  {name: "email", type: "textbox", ref: "input[name='email']", value: "admin@example.com"},
  {name: "password", type: "textbox", ref: "input[name='password']", value: "Tester12345"}
])

// Submit form
playwright_browser_click({element: "Login button", ref: "button[type='submit']"})

// Wait for redirect to dashboard
playwright_browser_wait_for({text: "Dashboard"})
```

**Logout Flow:**
```javascript
// Click user menu
playwright_browser_click({element: "User menu", ref: "[data-testid='user-menu']"})

// Click logout option
playwright_browser_click({element: "Logout", ref: "text=Logout"})

// Verify redirect to login
playwright_browser_wait_for({text: "Sign in"})
```

### Data Verification and Testing

**Form Submission Testing:**
```javascript
// Navigate to form page
playwright_browser_navigate("http://localhost:3000/admin/users/new")

// Fill user creation form
playwright_browser_fill_form([
  {name: "email", type: "textbox", ref: "input[name='email']", value: "newuser@example.com"},
  {name: "firstName", type: "textbox", ref: "input[name='firstName']", value: "John"},
  {name: "lastName", type: "textbox", ref: "input[name='lastName']", value: "Doe"},
  {name: "role", type: "combobox", ref: "select[name='role']", value: "user"}
])

// Submit form
playwright_browser_click({element: "Create user button", ref: "button[type='submit']"})

// Wait for success message
playwright_browser_wait_for({text: "User created successfully"})

// Verify user appears in list
playwright_browser_navigate("http://localhost:3000/admin/users")
playwright_browser_wait_for({text: "newuser@example.com"})
```

**File Upload Testing:**
```javascript
// Navigate to upload page
playwright_browser_navigate("http://localhost:3000/datasets/upload")

// Upload test file
playwright_browser_file_upload({
  paths: ["/absolute/path/to/testdata/spss/demo.sav"]
})

// Wait for upload completion
playwright_browser_wait_for({text: "Upload completed"})
```

### Debugging and Inspection

**Page State Inspection:**
```javascript
// Take screenshot for debugging
playwright_browser_take_screenshot({
  filename: "debug-screenshot.png",
  fullPage: true
})

// Evaluate JavaScript on page
playwright_browser_evaluate({
  function: "() => { return document.title; }"
})

// Get console messages
playwright_browser_console_messages()

// Get network requests
playwright_browser_network_requests()
```

**Waiting for Elements and Content:**
```javascript
// Wait for specific text to appear
playwright_browser_wait_for({text: "Loading complete"})

// Wait for text to disappear
playwright_browser_wait_for({textGone: "Loading..."})

// Wait for specific time
playwright_browser_wait_for({time: 2})
```

## Test Data Management

### Test Database Setup

The tests use a separate test database configured in `config.ts`:

```typescript
export const testConfig = {
  baseURL: 'http://localhost:3000',
  testUser: {
    email: 'admin@example.com',
    password: 'Tester12345'
  },
  database: {
    // Test database configuration
  }
}
```

### Test Data Files

**SPSS Test Files:**
- Located in `testdata/spss/`
- Various sample datasets for testing upload and analysis features
- Use these files for consistent test data across test runs

**Test Utilities:**
- `utils.ts` contains helper functions for common test operations
- Database seeding and cleanup utilities
- User authentication helpers

## Common Testing Patterns

### Page Object Model

Create reusable page objects for complex interactions:

```javascript
class AdminUsersPage {
  async navigateToUsersPage() {
    await playwright_browser_navigate("http://localhost:3000/admin/users");
    await playwright_browser_wait_for({text: "Users"});
  }

  async createUser(userData) {
    await playwright_browser_click({element: "Add user button", ref: "text=Add User"});
    await playwright_browser_fill_form([
      {name: "email", type: "textbox", ref: "input[name='email']", value: userData.email},
      {name: "firstName", type: "textbox", ref: "input[name='firstName']", value: userData.firstName}
    ]);
    await playwright_browser_click({element: "Submit", ref: "button[type='submit']"});
  }

  async verifyUserExists(email) {
    await playwright_browser_wait_for({text: email});
  }
}
```

### Test Data Cleanup

Ensure tests clean up after themselves:

```javascript
// Before each test
async function setupTestData() {
  // Create necessary test data
}

// After each test
async function cleanupTestData() {
  // Remove test data to avoid conflicts
}
```

## Debugging Test Failures

### Investigation Workflow

1. **Check test output**: Review error messages and stack traces
2. **Examine screenshots**: Look in `test-results/` for failure screenshots
3. **Review network logs**: Check API calls and responses
4. **Inspect console errors**: Look for JavaScript errors
5. **Verify test data**: Ensure database state is as expected

### Common Issues and Solutions

**Element Not Found:**
- Use `playwright_browser_snapshot()` to see current page state
- Verify selectors are correct
- Add proper waits for dynamic content

**Timing Issues:**
- Use `playwright_browser_wait_for()` instead of fixed delays
- Wait for specific content rather than arbitrary timeouts
- Consider network delays and loading states

**Authentication Problems:**
- Verify test user credentials in `config.ts`
- Check if session persistence is working correctly
- Ensure login flow is completing successfully

**Database State Issues:**
- Verify test data setup and cleanup
- Check for data conflicts between tests
- Ensure test database isolation

### Debug Mode Usage

Run tests in debug mode for step-by-step execution:

```bash
pnpm --filter e2e-web exec playwright test --debug tests/specific-test.spec.ts
```

This allows you to:
- Step through test execution
- Inspect page state at each step
- Modify selectors and actions interactively
- Understand test failures in detail

## Best Practices

### Test Writing Guidelines

1. **Use descriptive test names**: Clearly describe what the test verifies
2. **Keep tests independent**: Each test should be able to run in isolation
3. **Use proper waits**: Wait for specific conditions, not arbitrary timeouts
4. **Clean up test data**: Ensure tests don't interfere with each other
5. **Use page object patterns**: Encapsulate complex interactions in reusable functions

### MCP Integration Tips

1. **Take snapshots first**: Use `playwright_browser_snapshot()` to understand page structure
2. **Use specific selectors**: Prefer data-testid attributes or specific CSS selectors
3. **Wait for content**: Always wait for expected content before proceeding
4. **Handle errors gracefully**: Check for error states and handle them appropriately
5. **Document complex flows**: Add comments explaining multi-step interactions

### Performance Considerations

1. **Run tests in parallel**: Configure appropriate worker count
2. **Use test sharding**: Split test suites across multiple runners
3. **Optimize test data**: Use minimal data sets for faster execution
4. **Cache authentication**: Reuse login state when possible
5. **Monitor test execution time**: Identify and optimize slow tests