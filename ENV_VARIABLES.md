# Environment Variables for Railway Deployment

## Required Variables

Copy these into Railway's environment variables section:

### Database
```
DATABASE_URL=<your-railway-mysql-connection-string>
```
Get this from Railway MySQL addon after adding it to your project.

### Authentication & Security
```
JWT_SECRET=<generate-random-32-char-string>
```
Generate with: `openssl rand -base64 32`

### Manus OAuth (if using Manus authentication)
```
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
VITE_APP_ID=<your-manus-app-id>
OWNER_OPEN_ID=<your-owner-openid>
OWNER_NAME=<your-name>
```

### Manus API (for image generation)
```
BUILT_IN_FORGE_API_KEY=<your-manus-backend-api-key>
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-manus-frontend-api-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
MANUS_API_KEY=<your-manus-api-key>
```

### App Configuration
```
VITE_APP_TITLE=Sovereign Agent
VITE_APP_LOGO=/sovereign-agent-logo.png
```

### OpenAI API (for AI chat)
```
OPENAI_API_KEY=<your-openai-api-key>
```
Get from: https://platform.openai.com/api-keys

### Optional Analytics
```
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### Build Configuration
```
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048
```

---

## Quick Copy-Paste Template

```bash
# Database
DATABASE_URL=

# Security
JWT_SECRET=

# Manus OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
VITE_APP_ID=
OWNER_OPEN_ID=
OWNER_NAME=

# Manus API
BUILT_IN_FORGE_API_KEY=
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
MANUS_API_KEY=

# App Config
VITE_APP_TITLE=Sovereign Agent
VITE_APP_LOGO=/sovereign-agent-logo.png

# OpenAI
OPENAI_API_KEY=

# Build
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048
```

Fill in the blank values and paste into Railway's environment variables section.
