# Security Guidelines for VibeDev ID

## Environment Variables

### Best Practices

1. **Never commit sensitive keys to version control**
   - Use `.env.local` for local development (already in .gitignore)
   - Use `.env.example` or `.env.local.example` for documentation with placeholder values

2. **Use proper prefixes**
   - `NEXT_PUBLIC_*` - For variables that can be exposed to the browser
   - All other variables - Server-side only, kept secret

3. **Sensitive Variables (Keep Secret!)**
   - `SUPABASE_SERVICE_ROLE_KEY` - Full admin access to your database
   - `UPLOADTHING_TOKEN` - API access to your file upload service
   - Any other API keys or tokens without `NEXT_PUBLIC_` prefix

4. **Public Variables (Safe to expose)**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key with RLS protection
   - `NEXT_PUBLIC_SITE_URL` - Your website URL

### Setting Up Environment Variables

#### Local Development

1. Copy `.env.local.example` to `.env.local`
2. Fill in your actual values
3. Never commit `.env.local`

#### Vercel Deployment

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add each variable from `VERCEL_ENV_TEMPLATE.txt`
3. Use your actual values, not placeholders

### Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No real API keys in `.env.example`
- [ ] No console.log of sensitive tokens
- [ ] Server-side keys only used in server components/API routes
- [ ] Regular key rotation for production environments

### If Keys Are Exposed

1. **Immediately rotate the exposed keys**
   - Supabase: Project Settings > API > Regenerate keys
   - UploadThing: Dashboard > Regenerate API key

2. **Update all environments**
   - Local `.env.local`
   - Vercel environment variables
   - Any other deployments

3. **Check for unauthorized usage**
   - Review Supabase logs
   - Check UploadThing usage statistics

## Reporting Security Issues

If you discover a security vulnerability, please email security@vibedev.id instead of using public issue trackers.
