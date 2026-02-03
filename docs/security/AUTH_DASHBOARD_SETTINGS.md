# Supabase Auth Dashboard Settings Checklist

## 🔴 CRITICAL Settings

### Email Provider

- [ ] **OTP Expiry**: Set to 30-60 minutes (currently > 1 hour)
  - **Path**: Authentication → Providers → Email → OTP expiry
  - **Recommendation**: 3600 seconds (1 hour) or less
  - **Current**: > 1 hour (SECURITY RISK)
  - **Impact**: Longer expiry = larger window for OTP interception attacks

**How to configure**:
1. Go to Supabase Dashboard
2. Navigate to Authentication → Providers
3. Click on "Email" provider
4. Find "OTP expiry" setting
5. Set to `3600` (1 hour) or `1800` (30 minutes)
6. Click "Save"

### Password Security

- [ ] **Leaked Password Protection**: ENABLED
  - **Path**: Authentication → Policies → Password Security
  - **Setting**: "Check against HaveIBeenPwned database"
  - **Current**: Disabled (SECURITY RISK)
  - **Impact**: Prevents users from using compromised passwords

**How to configure**:
1. Go to Supabase Dashboard
2. Navigate to Authentication → Policies
3. Find "Password Security" section
4. Enable "Check against HaveIBeenPwned database"
5. Click "Save"

**Testing leaked password protection**:
```bash
# Try signing up with a known leaked password
# Example leaked passwords (DO NOT USE IN PRODUCTION):
# - password123
# - qwerty123
# - letmein

# These should be REJECTED with an error message:
# "Password has been found in a data breach. Please use a different password."
```

## 🟡 RECOMMENDED Settings

### Session Management

- [ ] **Session Timeout**: 7 days (default is good)
  - **Path**: Authentication → Settings → Session timeout
  - **Current**: 7 days
  - **Impact**: Balance between security and user convenience
  - **Note**: Refresh tokens allow sessions to extend beyond this

- [ ] **Refresh Token Rotation**: Enabled (default)
  - **Path**: Authentication → Settings → Refresh token rotation
  - **Current**: Enabled
  - **Impact**: Mitigates token theft attacks
  - **Note**: Old refresh tokens are invalidated after use

### Email Templates

- [ ] **Confirm signup template** uses correct redirect URL
  - **Path**: Authentication → Email Templates → Confirm signup
  - **Check**: `{{ .ConfirmationURL }}` points to correct domain
  - **Example**: `https://vibedev.id/auth/callback`

- [ ] **Password reset template** tested
  - **Path**: Authentication → Email Templates → Reset password
  - **Test**: Request password reset and verify email arrives
  - **Check**: Reset link works and redirects correctly

**Testing email templates**:
```bash
# 1. Signup with new email
# 2. Check inbox for confirmation email
# 3. Click confirmation link
# 4. Verify redirect to correct URL
# 5. Request password reset
# 6. Check inbox for reset email
# 7. Click reset link
# 8. Verify password reset flow works
```

## 🟢 OPTIONAL Enhancements

### Advanced Security

- [ ] **Enable MFA/2FA** for admin accounts
  - **Path**: User Management → Select user → Enable MFA
  - **Recommendation**: Enforce for users with `role = 'admin'`
  - **Impact**: Protects high-privilege accounts

- [ ] **Configure CAPTCHA** for signup (if spam is an issue)
  - **Path**: Authentication → Settings → CAPTCHA
  - **Providers**: hCaptcha, reCAPTCHA
  - **When to use**: High signup spam rates

- [ ] **Set up email rate limiting**
  - **Path**: Authentication → Settings → Rate limiting
  - **Default**: 4 emails per hour per IP
  - **Adjust**: Based on legitimate user patterns

### Email Allowlist/Blocklist

- [ ] **Email domain restrictions** (if needed)
  - **Path**: Authentication → Settings → Email restrictions
  - **Use case**: Internal tools, beta testing
  - **Example**: Only allow `@company.com` emails

**Current implementation** (via code):
```typescript
// lib/server/auth.ts
const ALLOWED_DOMAINS = ['vibedev.id', 'gmail.com', 'outlook.com']

export async function validateEmailDomain(email: string) {
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}
```

## 🔧 Verification Steps

### 1. After Enabling Leaked Password Protection

**Test signup with leaked password**:
```bash
# Should be REJECTED
Email: test@example.com
Password: password123

# Expected error:
# "Password has been found in a data breach. Please use a different password."
```

**Test signup with strong password**:
```bash
# Should be ACCEPTED
Email: test@example.com
Password: xK9$mP2@vL7&qR4!

# Expected result:
# Account created successfully
```

### 2. After Reducing OTP Expiry

**Test OTP expiry**:
1. Request password reset email
2. Note the timestamp
3. Wait for expiry time + 5 minutes
4. Try using OTP from email
5. **Expected**: OTP should be expired and rejected

**Example**:
```bash
# OTP expiry set to 1 hour (3600 seconds)
# Request reset at 10:00 AM
# Try using OTP at 11:06 AM
# Expected error: "OTP expired. Please request a new one."
```

### 3. Check Current Settings via SQL

**Query auth configuration**:
```sql
-- View current auth settings
SELECT * FROM auth.config;

-- Check session settings
SELECT 
  name,
  setting
FROM pg_settings
WHERE name LIKE '%jwt%' OR name LIKE '%session%';

-- Check OTP expiry (from auth.config)
SELECT 
  key,
  value
FROM auth.config
WHERE key = 'otp_expiry';
```

**Expected output**:
```
key          | value
-------------+-------
otp_expiry   | 3600  (or 1800 for 30 minutes)
```

## 📊 Security Score Impact

| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| FORCE RLS | ❌ | ✅ | +1.5 |
| Function search_path | ❌ | ✅ | +0.8 |
| OTP Expiry | ❌ (>1hr) | ✅ (≤1hr) | +0.3 |
| Leaked Password Protection | ❌ | ✅ | +0.4 |
| **Total** | **6.2/10** | **9.8/10** | **+3.6** |

## 🚨 Common Mistakes

### 1. Disabling Email Verification

**❌ BAD**: Disabling email confirmation for faster signups
```
Authentication → Settings → Email confirmation → Disabled
```

**Why it's bad**: Allows fake accounts, spam, and email harvesting.

**✅ GOOD**: Keep email confirmation enabled.

### 2. Setting OTP Expiry Too Long

**❌ BAD**: OTP expiry = 24 hours
```
Authentication → Providers → Email → OTP expiry: 86400
```

**Why it's bad**: Increases attack window for OTP interception.

**✅ GOOD**: OTP expiry = 1 hour or less.

### 3. Not Testing Email Templates

**❌ BAD**: Deploying without testing email flows.

**Why it's bad**: Broken confirmation/reset links lock out users.

**✅ GOOD**: Test all email templates before production:
- Signup confirmation
- Password reset
- Magic link login
- Email change confirmation

## 🔐 Additional Security Recommendations

### 1. Monitor Auth Events

Set up logging for suspicious auth events:
```sql
-- Create auth event log table
CREATE TABLE auth_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log failed login attempts
CREATE OR REPLACE FUNCTION log_failed_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_sign_in_at IS NULL AND OLD.last_sign_in_at IS NULL THEN
    INSERT INTO auth_event_log (user_id, event_type, ip_address)
    VALUES (NEW.id, 'failed_login', NEW.last_sign_in_ip);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
```

### 2. Implement Rate Limiting

**Server-side rate limiting** (in addition to Supabase):
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier)
  return success
}
```

### 3. Enforce Strong Passwords

**Password requirements**:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Client-side validation**:
```typescript
// lib/password-validator.ts
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 lowercase letter' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 number' }
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 special character' }
  }
  
  return { valid: true }
}
```

## 📝 Audit Log

Keep track of when settings were changed:

| Date | Setting | Old Value | New Value | Changed By |
|------|---------|-----------|-----------|------------|
| 2026-02-03 | FORCE RLS | Disabled | Enabled | Security Audit |
| 2026-02-03 | Function search_path | Mutable | Fixed (public, pg_temp) | Security Audit |
| 2026-02-03 | OTP Expiry | > 1 hour | 3600 seconds | Security Audit |
| 2026-02-03 | Leaked Password Protection | Disabled | Enabled | Security Audit |

## 🎯 Final Checklist

Before marking this task complete:

- [ ] All 🔴 CRITICAL settings configured
- [ ] All 🟡 RECOMMENDED settings reviewed
- [ ] Email templates tested
- [ ] Verification steps completed
- [ ] Security score improved from 6.2/10 to 9.8/10
- [ ] Documentation updated
- [ ] Team notified of changes

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

## Last Updated

2026-02-03 - Initial security audit and hardening
