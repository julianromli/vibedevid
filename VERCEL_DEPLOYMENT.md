# Vercel Deployment Guide

## Environment Variables Setup

The deployment error you're encountering is due to incorrect or missing environment variables in Vercel. Follow these steps to fix it:

### 1. Required Environment Variables

You need to set these environment variables in your Vercel dashboard:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://qabfrhpbfvjcgdrxdlba.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_SITE_URL` | Your production site URL | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Redirect URL for auth | `https://your-domain.vercel.app` |
| `UPLOADTHING_TOKEN` | UploadThing token for file uploads | `eyJhcGlLZXkiOiJza19saXZlX...` |

### 2. How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Navigate to your project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the sidebar
5. Add each variable with the correct values

### 3. Common Issues and Solutions

#### Issue: `TypeError: Invalid URL`
**Cause:** The `NEXT_PUBLIC_SUPABASE_URL` is not set correctly or contains an invalid URL.

**Solution:** 
- Make sure `NEXT_PUBLIC_SUPABASE_URL` is set to your actual Supabase project URL
- The URL should look like: `https://your-project-ref.supabase.co`
- DO NOT use the API key as the URL

#### Issue: Environment variables not found
**Cause:** Environment variables are not set in Vercel dashboard.

**Solution:**
- Double-check that all required environment variables are added in Vercel
- Make sure there are no typos in variable names
- Redeploy after adding environment variables

### 4. Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the following:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → use for `SUPABASE_SERVICE_ROLE_KEY`

### 5. Deployment Steps

1. Set all environment variables in Vercel dashboard
2. Redeploy your application
3. Check the deployment logs for any remaining errors

### 6. Testing Your Deployment

After deployment, test the following:
- Homepage loads correctly
- User authentication works
- Project showcase displays properly
- Database connections are working

## Troubleshooting

If you're still experiencing issues:

1. **Check Vercel logs** for specific error messages
2. **Verify environment variables** are correctly set
3. **Test locally** with the same environment variables
4. **Check Supabase connection** from your local environment

## Environment Variables Template

```bash
# Copy these to Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-domain.vercel.app
UPLOADTHING_TOKEN=your_uploadthing_token_here
```

## Contact Support

If you continue to have deployment issues, please share:
1. Complete deployment logs
2. Screenshot of your Vercel environment variables (with sensitive data blurred)
3. Your Supabase project settings
