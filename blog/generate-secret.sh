#!/bin/bash

echo "🔐 Generating NEXTAUTH_SECRET for Vercel deployment..."
echo ""

# Generate a secure secret
SECRET=$(openssl rand -base64 32)

echo "✅ Generated secure NEXTAUTH_SECRET:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Copy this secret and add it to your Vercel environment variables:"
echo ""
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add new variable:"
echo "   - Name: NEXTAUTH_SECRET"
echo "   - Value: $SECRET"
echo "   - Environment: Production, Preview, Development"
echo ""
echo "🚀 After adding, redeploy your app for the changes to take effect!"
