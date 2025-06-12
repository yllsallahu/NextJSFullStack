# 🚨 URGENT: OAuth & Database Fix Guide

## 🔍 PROBLEME TË IDENTIFIKUARA

1. **OAuth client not found (Error 401: invalid_client)** 
   - Google OAuth credentials problem
   - Callback URL mismatch
   
2. **Error loading blogs: Network response was not ok**
   - Database API returning 500 errors
   - MongoDB connection issues

3. **Status 500 errors në API endpoints**

## ✅ ENVIRONMENT VARIABLES (VERIFIED ✅)

Environment variables janë të vendosura në Vercel:
- ✅ NEXTAUTH_SECRET: true
- ✅ NEXTAUTH_URL: https://next-js-full-stack-blog.vercel.app
- ✅ MONGODB_URI: true
- ✅ GOOGLE_CLIENT_ID: true
- ✅ GOOGLE_CLIENT_SECRET: true

## 🔧 FIX 1: GOOGLE OAUTH CONFIGURATION

### Problem:
Google OAuth callback URL në Google Cloud Console është e gabuar ose missing.

### Solution:

**1. Google Cloud Console Setup:**
1. Shko në: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. **Add këto Authorized redirect URIs:**

```
https://next-js-full-stack-blog.vercel.app/api/auth/callback/google
```

**2. Verify NEXTAUTH_URL në Vercel:**
```
NEXTAUTH_URL=https://next-js-full-stack-blog.vercel.app
```

## 🔧 FIX 2: DATABASE CONNECTION

### Problem:
API endpoints returning 500 errors due to MongoDB connection failures.

### Test Database:
```bash
curl https://next-js-full-stack-blog.vercel.app/api/test-connection
```

### Solution - Update MongoDB Connection:

**Update MONGODB_URI në Vercel me SSL disabled:**
```
MONGODB_URI=mongodb+srv://ys68687:yllimali123@clusternext.zlp4afn.mongodb.net/myapp?retryWrites=true&w=majority&ssl=false&appName=NextJSFullStackBlog
```

## 🔧 FIX 3: API ENDPOINTS

Le të testojmë këto endpoints:

### Test Blog API:
```bash
curl https://next-js-full-stack-blog.vercel.app/api/blogs/
```

### Test User Registration:
```bash
curl -X POST https://next-js-full-stack-blog.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'
```

## 🚀 DEPLOYMENT STEPS

### Step 1: Google Cloud Console
1. **Shko në Google Cloud Console**
2. **APIs & Services → Credentials**
3. **Edit OAuth 2.0 Client ID**
4. **Add Authorized redirect URIs:**
   ```
   https://next-js-full-stack-blog.vercel.app/api/auth/callback/google
   ```

### Step 2: Vercel Environment Update
1. **Vercel Dashboard → Settings → Environment Variables**
2. **Update MONGODB_URI:**
   ```
   mongodb+srv://ys68687:yllimali123@clusternext.zlp4afn.mongodb.net/myapp?retryWrites=true&w=majority&ssl=false&appName=NextJSFullStackBlog
   ```

### Step 3: Redeploy
1. **Vercel Dashboard → Deployments**
2. **Click "Redeploy" on latest deployment**

### Step 4: Test Everything
```bash
# Test environment
curl https://next-js-full-stack-blog.vercel.app/api/test-env

# Test database
curl https://next-js-full-stack-blog.vercel.app/api/test-connection

# Test blog API
curl https://next-js-full-stack-blog.vercel.app/api/blogs/

# Test OAuth providers
curl https://next-js-full-stack-blog.vercel.app/api/auth/providers
```

## 🎯 EXPECTED RESULTS

After implementing fixes:

**✅ OAuth Fix Success:**
- Google sign-in works without "invalid_client" error
- Redirect after Google auth works correctly

**✅ Database Fix Success:**
- Blog loading works
- User registration works
- No more 500 errors

**✅ API Fix Success:**
- All endpoints return proper responses
- Database operations successful

## 🆘 DEBUGGING COMMANDS

If problems persist, use these for debugging:

```bash
# Check current environment
curl https://next-js-full-stack-blog.vercel.app/api/test-env

# Check database connection
curl https://next-js-full-stack-blog.vercel.app/api/test-connection

# Check NextAuth configuration
curl https://next-js-full-stack-blog.vercel.app/api/auth/providers

# Check specific API endpoints
curl https://next-js-full-stack-blog.vercel.app/api/blogs/
curl https://next-js-full-stack-blog.vercel.app/api/auth/csrf
```

---

**⚠️ KRITIKË:** Google OAuth callback URL është shkaku kryesor i error 401. Duhet të update ohet Google Cloud Console-in!
