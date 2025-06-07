# Critical Vercel Deployment Fixes

## 🚨 URGENT: Two Critical Issues Found

### 1. Missing NEXTAUTH_SECRET Environment Variable
**Error:** `[next-auth][error][NO_SECRET]`

**Solution:** Add `NEXTAUTH_SECRET` to your Vercel environment variables.

#### Generate a Secure Secret:
```bash
# Use this pre-generated secure secret:
7Ho4ppXnUavCGmWFG7MCquYkIIwrq4fn31w0TplRRx8=

# Or generate your own:
openssl rand -base64 32
```

#### Add to Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add new variable:
   - **Name:** `NEXTAUTH_SECRET`
   - **Value:** (paste the generated secret from above)
   - **Environment:** Production, Preview, Development

### 2. MongoDB Adapter Issue Fixed
**Problem:** The MongoDB adapter was calling `clientPromise()()` (double function call) instead of just `clientPromise`

**Fix Applied:** Updated the adapter creation in `/pages/api/auth/[...nextauth].ts`

## Required Environment Variables for Vercel

Make sure these are ALL set in your Vercel project:

```bash
# CRITICAL - Authentication
NEXTAUTH_SECRET=7Ho4ppXnUavCGmWFG7MCquYkIIwrq4fn31w0TplRRx8=
NEXTAUTH_URL=https://your-app.vercel.app

# CRITICAL - Database
MONGODB_URI=mongodb+srv://your-connection-string

# OPTIONAL - OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## How to Add Environment Variables to Vercel

1. **Via Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add each variable one by one

2. **Via Vercel CLI:**
   ```bash
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add MONGODB_URI
   ```

## After Adding Environment Variables

1. **Redeploy:** Your app will need to redeploy to pick up the new environment variables
2. **Test:** Visit your production URL and try:
   - User registration at `/sign-up`
   - User sign-in at `/auth/signin`
   - Database test at `/api/test-db`

## Verification Commands

After deployment, test these endpoints:

```bash
# Test database connection
curl https://your-app.vercel.app/api/test-db

# Test user registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## Expected Results

✅ **Database Test:** Should return `{"status":"success"}`  
✅ **Registration:** Should return `{"success":true}`  
✅ **Sign-in:** Should redirect to homepage after successful login  
✅ **No More Errors:** No `NO_SECRET` or database connection errors in logs

## Files Modified
- `/pages/api/auth/[...nextauth].ts` - Fixed MongoDB adapter double function call
- `/src/lib/mongodb.ts` - Previously fixed build-time detection logic
