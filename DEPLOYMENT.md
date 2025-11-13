# Sovereign Agent - Railway Deployment Guide

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Deploy to Railway

Click this button to deploy:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/sovereign-agent)

**OR** manually:
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select the `sovereign-agent` repository
4. Railway will auto-detect the configuration

### Step 2: Add Environment Variables

In Railway dashboard, go to **Variables** tab and add these:

#### Required Variables:

```bash
# Database (Railway provides MySQL addon)
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Manus OAuth (if using Manus auth)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Your Name

# Manus API Keys (for image generation)
BUILT_IN_FORGE_API_KEY=your-manus-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# App Configuration
VITE_APP_TITLE=Sovereign Agent
VITE_APP_LOGO=/sovereign-agent-logo.png

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# OpenAI API (for AI chat)
OPENAI_API_KEY=your-openai-api-key
```

#### How to Get These Values:

**DATABASE_URL:**
- In Railway, add "MySQL" addon
- Copy the connection string from MySQL addon variables

**JWT_SECRET:**
- Generate random string: `openssl rand -base64 32`
- Or use any random 32+ character string

**MANUS_API_KEY:**
- Get from your Manus dashboard
- Or use alternative image generation API

**OPENAI_API_KEY:**
- Get from [platform.openai.com](https://platform.openai.com/api-keys)
- Required for AI chat feature

### Step 3: Deploy Database Schema

After deployment, run migrations:

1. In Railway dashboard, go to your project
2. Click on the service → **Settings** → **Deploy**
3. Add a one-time command:
   ```bash
   pnpm run db:push
   ```
4. Or use Railway CLI:
   ```bash
   railway run pnpm run db:push
   ```

### Step 4: Verify Deployment

1. Railway will provide a public URL (e.g., `https://sovereign-agent.up.railway.app`)
2. Visit the URL
3. Test image generation
4. Test AI chat
5. Verify authentication works

---

## 🔧 Alternative: Deploy Without Manus OAuth

If you don't want to use Manus OAuth, you can:

1. **Remove authentication** (make app public)
2. **Use alternative auth** (Auth0, Clerk, etc.)
3. **Implement custom auth**

Contact me if you need help with this.

---

## 📊 Resource Requirements

**Railway Free Tier:**
- ✅ 500 hours/month runtime
- ✅ 1GB RAM
- ✅ 1GB disk
- ✅ Sufficient for this app

**Estimated Costs (if exceeding free tier):**
- ~$5-10/month for small traffic
- Scales automatically with usage

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "JavaScript heap out of memory"
- Railway allocates 2GB for builds (should work)
- If still failing, contact Railway support

### Database Connection Fails

**Error:** "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check MySQL addon is running
- Ensure SSL is enabled if required

### Image Generation Fails

**Error:** "API key invalid"
- Verify BUILT_IN_FORGE_API_KEY is set
- Check MANUS_API_KEY has credits
- Test API key in Manus dashboard

### AI Chat Not Working

**Error:** "OpenAI API error"
- Verify OPENAI_API_KEY is valid
- Check OpenAI account has credits
- Ensure API key has chat permissions

---

## 📞 Support

If you encounter issues:
1. Check Railway logs (Dashboard → Service → Logs)
2. Verify all environment variables are set
3. Test database connection
4. Contact Railway support or Manus support

---

## 🎉 Success!

Your Sovereign Agent is now live! Share the URL and start generating AI images.

**Next Steps:**
- Set up custom domain
- Configure analytics
- Add more features
- Scale as needed
