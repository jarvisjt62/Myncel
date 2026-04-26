# Myncel Testing Guide

## Overview
This guide explains how to test the Myncel AI Predictive Maintenance application.

---

## Testing Environments

### 1. Production Environment (Recommended)
**URL:** https://www.myncel.com
- Real database
- All features enabled
- Best for end-to-end testing

### 2. Local Development
```bash
cd /workspace/myncel
npm run dev
```
- Runs on http://localhost:3000
- Uses your local database
- Best for development testing

---

## Test Accounts

### Admin Account
- **Email:** admin@myncel.com
- **Password:** Admin123!
- **Access:** Full admin dashboard at `/admin`

### Test User Account
You can create a test account by:
1. Going to https://www.myncel.com/signup
2. Filling in the registration form
3. Using a test email (you can use a temporary email service)

---

## Testing Scenarios

### 1. User Registration Flow
1. Navigate to `/signup`
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: Test@1234 (must include uppercase, lowercase, number, special char)
   - Company Name: Test Company
   - Industry: Manufacturing
   - Company Size: Small
3. Complete reCAPTCHA
4. Submit form
5. Verify success message

### 2. User Login Flow
1. Navigate to `/signin`
2. Enter credentials
3. Complete reCAPTCHA
4. Submit
5. Verify redirect to `/dashboard`

### 3. Admin Dashboard Access
1. Login with admin credentials
2. Verify redirect to `/admin` (not `/dashboard`)
3. Test admin features:
   - View all users
   - View all organizations
   - View chat sessions
   - View audit logs

### 4. Equipment Management
1. Login as regular user
2. Navigate to `/equipment`
3. Click "+ Add Equipment"
4. Fill in machine details:
   - Name: CNC Machine 1
   - Model: Haas VF-2
   - Location: Production Floor A
   - Serial Number: HAAS-001
   - Installation Date: 2024-01-15
5. Save
6. Verify machine appears in list

### 5. Work Order Creation
1. Navigate to `/work-orders`
2. Click "+ Create Work Order"
3. Select equipment
4. Fill in:
   - Title: Preventive Maintenance
   - Description: Monthly inspection
   - Type: Preventive
   - Priority: Medium
   - Due Date: Tomorrow
5. Save
6. Verify work order created

### 6. AI Chat Testing
1. Click the chat widget (bottom right)
2. Switch to "AI Assistant" mode
3. Test questions:
   - "How do I add a machine?"
   - "What are the pricing plans?"
   - "How does predictive maintenance work?"
4. Verify context-aware responses:
   - Ask "yes" after pricing question
   - Verify AI understands context
5. Test "Clear Chat" button

### 7. Live Support Chat
1. Switch to "Live Support" mode
2. Send a message
3. Verify system message appears
4. Test "End Chat" button

---

## Creating Test Equipment

Since there's no pre-built virtual equipment, you can create test machines:

### Sample Equipment Data

#### CNC Machine
```
Name: CNC Milling Machine
Model: Haas VF-2
Location: Production Floor A
Serial Number: HAAS-2024-001
Installation Date: 2024-01-15
```

#### Injection Molding Machine
```
Name: Injection Molder
Model: Engel e-victory
Location: Production Floor B
Serial Number: ENGEL-2024-002
Installation Date: 2024-02-01
```

#### Press Brake
```
Name: Hydraulic Press Brake
Model: Trumpf TruBend
Location: Workshop
Serial Number: TRUMPF-2024-003
Installation Date: 2024-03-10
```

---

## Testing Checklist

### Authentication
- [ ] User registration with valid data
- [ ] User registration with weak password (should fail)
- [ ] User registration with duplicate email (should fail)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials (should show error)
- [ ] Password reset flow
- [ ] Admin login and redirect to `/admin`

### Dashboard
- [ ] Dashboard loads correctly
- [ ] Equipment count displays
- [ ] Active work orders display
- [ ] Upcoming maintenance displays
- [ ] Recent alerts display

### Equipment Management
- [ ] Add new equipment
- [ ] View equipment list
- [ ] Edit equipment details
- [ ] Delete equipment

### Work Orders
- [ ] Create work order
- [ ] View work orders list
- [ ] Update work order status
- [ ] Assign work order to technician
- [ ] Delete work order

### AI Chat
- [ ] AI responds to questions
- [ ] AI maintains conversation context
- [ ] Clear Chat button works
- [ ] Quick questions work

### Live Support
- [ ] Send message to support
- [ ] System confirmation appears
- [ ] End Chat button works

### Admin Dashboard
- [ ] View all users
- [ ] View all organizations
- [ ] View chat sessions
- [ ] View audit logs
- [ ] Admin-only pages protected

---

## Security Testing

### Rate Limiting
1. Try to register 4 times in an hour (should be blocked on 4th attempt)
2. Try password reset 4 times in an hour (should be blocked on 4th attempt)

### Authorization
1. Try to access `/admin` as regular user (should redirect)
2. Try to access another organization's data (should fail)

### Input Validation
1. Try to register with weak password (should fail)
2. Try to add equipment without required fields (should fail)

---

## Browser Testing

### Supported Browsers
- Chrome/Edge (recommended)
- Firefox
- Safari

### Mobile Testing
- Test on mobile devices
- Verify responsive design
- Test mobile chat widget

---

## Performance Testing

### Load Testing
- Test with multiple concurrent users
- Monitor page load times
- Check database query performance

### Stress Testing
- Create many work orders
- Add many equipment items
- Test with large datasets

---

## Common Issues

### reCAPTCHA Issues
- If reCAPTCHA fails, check browser console
- Ensure cookies are enabled
- Try different browser

### Login Issues
- Verify email is lowercase in database
- Check password complexity requirements
- Ensure NEXTAUTH_SECRET is set

### Database Issues
- Check database connection
- Verify Prisma migrations are applied
- Check environment variables

---

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Console errors (if any)

---

## Next Steps

1. Create test account
2. Add test equipment
3. Create test work orders
4. Test all features
5. Report any issues found