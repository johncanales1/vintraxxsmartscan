# 🔴 CRITICAL BACKEND FIXES FOR EMAIL VERIFICATION

## Problem Identified
Your Base44 backend is generating verification links pointing to **Supabase** (`zcjebvfcihiynt.supabase.co`) instead of your VinTraxx app. This causes "NOT_FOUND" errors.

---

## 🛠️ REQUIRED BACKEND CHANGES IN BASE44

### **FIX 1: Update /register Function - Change Verification Link**

**Location:** Base44 function `/register`

**Find this code (or similar):**
```javascript
const verificationLink = `https://zcjebvfcihiynt.supabase.co/verify?email=${email}&token=${token}`;
```

**Replace with:**
```javascript
// Generate deep link that opens mobile app
const verificationLink = `vintraxx://verify?email=${encodeURIComponent(email)}&token=${token}`;
```

**Full register function should include:**
```javascript
// In your /register function, after creating user and token:

// Generate verification link (deep link to mobile app)
const verificationLink = `vintraxx://verify?email=${encodeURIComponent(email)}&token=${verificationToken}`;

// Send email with the verification link
await sendEmail({
  to: email,
  subject: 'Verify Your VinTraxx SmartScan Account',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a8a;">Welcome to VinTraxx SmartScan!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" 
         style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; 
                color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Verify Email
      </a>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 24 hours.
      </p>
      <p style="color: #666; font-size: 14px;">
        If you didn't create this account, please ignore this email.
      </p>
    </div>
  `
});
```

---

### **FIX 2: Verify /verifyEmail Function Exists**

**Location:** Base44 function `/verifyEmail`

**Ensure this function exists and works correctly:**

```javascript
// POST /api/functions/verifyEmail
export default async function handler(req, res) {
  try {
    const { email, token } = req.body;

    // Validate inputs
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email and token are required'
      });
    }

    // Find user by email
    const user = await db.users.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Verify token matches
    if (user.verificationToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if token expired (24 hours)
    const now = new Date();
    if (user.verificationTokenExpiry && now > new Date(user.verificationTokenExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new one.'
      });
    }

    // Update user - mark as verified
    await db.users.updateOne(
      { email },
      {
        $set: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
}
```

---

### **FIX 3: Update /login Function - Check Email Verification**

**Location:** Base44 function `/login`

**Add email verification check:**

```javascript
// POST /api/functions/login
export default async function handler(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.users.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ⚠️ CHECK EMAIL VERIFICATION (ADD THIS)
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        requiresVerification: true  // Important flag for mobile app
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update last login
    await db.users.updateOne(
      { email },
      { $set: { lastLoginAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      token,
      userId: user.userId,
      email: user.email,
      emailVerified: user.emailVerified,
      deviceSetupCompleted: user.deviceSetupCompleted || false,
      deviceName: user.deviceName || null,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
}
```

---

### **FIX 4: Update /resendVerification Function**

**Location:** Base44 function `/resendVerification`

**Ensure this function generates correct deep link:**

```javascript
// POST /api/functions/resendVerification
export default async function handler(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await db.users.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new token
    const newToken = generateRandomToken(); // or use uuid
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await db.users.updateOne(
      { email },
      {
        $set: {
          verificationToken: newToken,
          verificationTokenExpiry: expiry
        }
      }
    );

    // Generate deep link (NOT Supabase link!)
    const verificationLink = `vintraxx://verify?email=${encodeURIComponent(email)}&token=${newToken}`;

    // Send email
    await sendEmail({
      to: email,
      subject: 'Verify Your VinTraxx SmartScan Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">Verify Your Email</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Verify Email
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
}
```

---

## 🔍 CHECKLIST FOR BASE44

- [ ] **Remove all Supabase references** from your code
- [ ] **Update verification links** to use `vintraxx://verify?email=...&token=...`
- [ ] **Test /register** - should send email with correct deep link
- [ ] **Test /verifyEmail** - should verify token and update user
- [ ] **Test /login** - should check emailVerified before allowing login
- [ ] **Test /resendVerification** - should send new email with correct link
- [ ] **Verify JWT_SECRET** is set in Base44 environment variables
- [ ] **Check database schema** has all required fields:
  - `emailVerified` (boolean)
  - `verificationToken` (string, nullable)
  - `verificationTokenExpiry` (timestamp, nullable)

---

## 📱 MOBILE APP CHANGES (ALREADY COMPLETED)

✅ Added deep linking configuration (Android & iOS)
✅ Added deep link handler in App.tsx
✅ Updated API configuration with correct Base44 URL

---

## 🧪 TESTING FLOW

After implementing backend fixes:

1. **Register new user** → Should receive email with `vintraxx://verify?...` link
2. **Click verification link** → Should open mobile app
3. **App verifies email** → Should show success message
4. **Try to login** → Should work after verification
5. **Try to login before verification** → Should show "verify email" error

---

## ⚠️ IMPORTANT NOTES

- **Deep link format:** `vintraxx://verify?email=user@example.com&token=abc123`
- **NOT web URL:** Don't use `https://...` for verification links
- **Email encoding:** Always use `encodeURIComponent(email)` in links
- **Token security:** Use secure random tokens (UUID or crypto.randomBytes)
- **Expiry:** Set 24-hour expiry for verification tokens

---

## 🚀 DEPLOYMENT ORDER

1. **Deploy backend fixes** to Base44
2. **Test with Postman/curl** to verify endpoints work
3. **Rebuild mobile app** (already has deep linking)
4. **Test full flow** end-to-end

---

**Questions? Issues?**
- Check Base44 logs for errors
- Verify JWT_SECRET is set
- Test each endpoint individually
- Check email delivery logs
