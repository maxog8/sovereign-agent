# 🚀 Sovereign Agent - Quick Start Guide

## Your 5-Minute Deployment Checklist

### ✅ Step 1: Open Railway (2 minutes)

1. Go to **[railway.app](https://railway.app)**
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`maxog8/sovereign-agent`** repository
5. Railway will auto-detect the configuration ✨

### ✅ Step 2: Add Database (1 minute)

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add MySQL"**
3. Railway will create a MySQL database
4. Copy the `DATABASE_URL` from the MySQL service variables

### ✅ Step 3: Set Environment Variables (2 minutes)

Click on your service → **"Variables"** tab → **"Raw Editor"** and paste:

```bash
# Paste the DATABASE_URL you copied
DATABASE_URL=<paste-from-mysql-addon>

# Generate JWT secret (run in terminal: openssl rand -base64 32)
JWT_SECRET=<paste-your-generated-secret>

# Manus API Keys (get from your Manus dashboard)
BUILT_IN_FORGE_API_KEY=<your-manus-backend-key>
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-manus-frontend-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
MANUS_API_KEY=<your-manus-api-key>

# OpenAI API (get from platform.openai.com/api-keys)
OPENAI_API_KEY=<your-openai-key>

# Manus OAuth (optional - for authentication)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
VITE_APP_ID=<your-manus-app-id>
OWNER_OPEN_ID=<your-owner-openid>
OWNER_NAME=<your-name>

# App Config
VITE_APP_TITLE=Sovereign Agent
VITE_APP_LOGO=/sovereign-agent-logo.png

# Build Config
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048
```

Click **"Save"** - Railway will automatically redeploy.

### ✅ Step 4: Run Database Migration (30 seconds)

After deployment completes:

1. Click on your service → **"Settings"** → **"Deploy"**
2. Scroll to **"Custom Start Command"**
3. Temporarily change to: `pnpm run db:push && pnpm run start`
4. Click **"Deploy"**
5. After migration completes, change back to: `pnpm run start`

**OR** use Railway CLI:
```bash
railway run pnpm run db:push
```

### ✅ Step 5: Test Your App! (30 seconds)

1. Railway will give you a public URL (e.g., `https://sovereign-agent.up.railway.app`)
2. Click the URL to open your app
3. Try generating an image
4. Test the AI chat
5. Done! 🎉

---

## 📋 Where to Get API Keys

### Manus API Keys
1. Go to your Manus dashboard
2. Navigate to API settings
3. Copy the keys

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy and save it (you won't see it again!)

### JWT Secret
Run in your terminal:
```bash
openssl rand -base64 32
```
Or use any random 32+ character string.

---

## 🆘 Troubleshooting

**Build fails?**
- Check that all environment variables are set
- Verify Railway has enough resources (should be fine on free tier)

**Can't connect to database?**
- Make sure you added MySQL addon
- Verify DATABASE_URL is correct
- Check that db:push migration ran successfully

**Image generation not working?**
- Verify MANUS_API_KEY is valid
- Check your Manus account has credits
- Test the API key in Manus dashboard

**AI chat not responding?**
- Verify OPENAI_API_KEY is set correctly
- Check OpenAI account has credits
- Ensure API key has chat permissions

---

## 🎯 Next Steps

Once deployed:
- ✅ Set up custom domain (Railway Settings → Domains)
- ✅ Monitor usage (Railway Dashboard → Metrics)
- ✅ Scale as needed (Railway auto-scales)
- ✅ Add more features!

---

## 📞 Need Help?

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **GitHub Repo**: [github.com/maxog8/sovereign-agent](https://github.com/maxog8/sovereign-agent)
- **Full Guide**: See `DEPLOYMENT.md` for detailed instructions

---

**You're all set! Welcome to Sovereign Agent! 🚀**
