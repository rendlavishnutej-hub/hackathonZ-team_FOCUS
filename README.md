# Aegis Auth: Production-Grade Next.js Authentication Template

A highly secure, multi-factor, passkey-first authentication platform built for modern SaaS applications. Aegis Auth combines Postgres level security policies, biometric hardware trust, k-anonymity breach audits, and sliding-window rate limiting to provide a bulletproof auth system.

---

## 🛡️ Security Architecture & Threat Model

Aegis Auth is built around a **Zero-Trust Client** security model. Here is how each implemented feature maps to real-world threats:

### 1. HTTP-Only, SameSite Session Cookies
*   **Threat**: Cross-Site Scripting (XSS) token theft. Standard SPAs storing tokens in `localStorage` or `sessionStorage` are vulnerable to having their tokens read by malicious scripts.
*   **Defense**: Sessions are managed entirely using `httpOnly` secure cookies via `@supabase/ssr`. JavaScript running in the browser cannot read these cookies, preventing session hijacking via XSS. `SameSite=Lax` prevents Cross-Site Request Forgery (CSRF).

### 2. Biometric Passkeys (WebAuthn / FIDO2)
*   **Threat**: Phishing, Credential Stuffing, and Sim Swapping. Passwords and SMS codes can be intercepted by phishing sites or spoofed cell towers.
*   **Defense**: Passkeys use cryptographic public-key cryptography tied to the specific domain (origin validation). Even if a user is tricked by a phishing site, the browser will refuse to sign the challenge for the spoofed domain. It is completely phishing-resistant.

### 3. Native TOTP Multi-Factor Authentication
*   **Threat**: Compromised passwords due to stuffing/reuse.
*   **Defense**: Integrates Supabase's native MFA API. Logging in with a password only awards Authenticator Assurance Level 1 (`aal1`). The user is forced to authenticate using a TOTP app to achieve `aal2`. RLS database policies reject any read/write requests if the JWT claims show only `aal1` for MFA-enrolled accounts.

### 4. Custom Backup Recovery Codes
*   **Threat**: Permanent account lockout if the authenticator device is lost.
*   **Defense**: Generates 8 single-use recovery codes upon MFA enrollment. Plaintext codes are displayed only *once* to the user. The database stores salted SHA-256 hashes of these codes. If used, the server deletes all MFA factors for the account (disabling MFA) and allows the user to re-establish access, logging the recovery event in the audit trail.

### 5. k-Anonymity Password Breach Auditing
*   **Threat**: Weak or compromised passwords.
*   **Defense**: Live client-side `zxcvbn` estimates crack-times and rejects guessable passwords. During signup and password updates, the server checks the k-anonymity HaveIBeenPwned API (sending only the first 5 characters of the SHA-1 password hash) to check if the password has been leaked in any known data breach, rejecting it if found.

### 6. IP-Based Sliding-Window Rate Limiting
*   **Threat**: Brute-Force and Denial of Service (DoS) attacks on login/signup endpoints.
*   **Defense**: Rate limiting powered by Upstash Redis and `@upstash/ratelimit`. Rejects clients exceeding 5 auth-related requests per minute per IP address with `429 Too Many Requests`.

### 7. Account Lockout & Backoff
*   **Threat**: Brute-force attacks targeting a single account email across different IPs.
*   **Defense**: Tracks failed attempts per email in Upstash Redis. After 5 consecutive failed logins, the account email is locked out for 15 minutes. Successful login resets the counter.

### 8. Database-Level Row Level Security (RLS)
*   **Threat**: Broken Object Level Authorization (BOLA/IDOR) where a client manipulates API requests to read/write another user's records.
*   **Defense**: Every database table (profiles, sessions_log, webauthn_credentials, backup_codes) is locked down with strict PostgreSQL RLS policies. The database itself validates `auth.uid() = user_id`, guaranteeing a user can never access or modify data belonging to other accounts.

### 9. Session Revocation & Audit Logs
*   **Threat**: Unmonitored active sessions on old/stolen devices.
*   **Defense**: Keeps a live `sessions_log` detailing IP, User Agent, approximate location, and status. Users can view active logins on `/dashboard/security`. Clicking "Revoke" deletes the session from `auth.sessions`, causing the Supabase Auth server to reject the JWT on the next API request. An active PostgreSQL trigger catches this deletion and marks the log row as inactive.

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

UPSTASH_REDIS_REST_URL=https://your-db-name.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema Setup
Execute the SQL migration script located in `supabase/migrations/20260713000000_schema_and_rls.sql` in the **Supabase SQL Editor** to create the tables, RPCs, triggers, and RLS policies.

### 4. Supabase Dashboard Settings
*   Go to **Authentication -> Provider Settings -> Email** and ensure **Confirm Email** is enabled.
*   Go to **Authentication -> URL Configuration** and set the **Site URL** to `http://localhost:3000` (or your production URL), and add `http://localhost:3000/auth/callback` to the redirect URLs list.
*   If using OAuth, configure Google/GitHub under **Authentication -> Providers** with your provider credentials.

---

## 🛠️ Tech Stack
*   **Framework**: Next.js 14+ App Router (TypeScript)
*   **Database & Auth**: Supabase (PostgreSQL, RLS)
*   **SDK**: `@supabase/ssr`
*   **Rate Limiting**: `@upstash/ratelimit` + `@upstash/redis`
*   **Biometrics (Passkeys)**: `@simplewebauthn/server` & `@simplewebauthn/browser`
*   **Password Quality**: `@zxcvbn-ts/core`
*   **Styling**: Tailwind CSS
