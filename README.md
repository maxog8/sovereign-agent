# Sovereign Agent

**AI-Powered Image Generator for the BNBChain Ecosystem**

Sovereign Agent is a full-stack web application that generates AI images using the Manus API and campaign tokens. Built with React, TypeScript, and Express, it features text-to-image generation, image-to-image transformation, and an AI chat assistant.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/sovereign-agent)

---

## ✨ Features

### 🎨 Image Generation
- **Text-to-Image**: Generate images from text prompts using AI
- **Image-to-Image**: Transform existing images with 8 artistic styles:
  - Anime Style
  - Studio Ghibli
  - Dragon Ball Z
  - Hyper Realistic
  - Oil Painting
  - Watercolor
  - Cyberpunk
  - Fantasy Art

### 🤖 AI Assistant
- General-purpose AI chat for prompt suggestions and assistance
- Prompt enhancement feature for better image generation
- Pre-built prompt templates for inspiration

### 🎨 User Experience
- Dark/Light mode toggle with smooth transitions
- Golden yellow color scheme (BNBChain branding)
- Responsive design for mobile and desktop
- User authentication and image gallery
- Download generated images

---

## 🚀 Quick Deploy (5 Minutes)

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/sovereign-agent)

### Option 2: Manual Deploy

See **[QUICK_START.md](./QUICK_START.md)** for step-by-step instructions.

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Radix UI components
- tRPC for type-safe API calls

**Backend:**
- Node.js + Express
- tRPC server
- MySQL (via Drizzle ORM)
- Manus API for image generation
- OpenAI API for chat assistant

**Deployment:**
- Railway (recommended)
- Docker-ready configuration
- Nixpacks build system

---

## 📋 Environment Variables

See **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** for complete list.

**Required:**
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session encryption key
- `MANUS_API_KEY` - Manus API for image generation
- `OPENAI_API_KEY` - OpenAI API for chat assistant

---

## 🏗️ Local Development

```bash
# Clone repository
git clone https://github.com/maxog8/sovereign-agent.git
cd sovereign-agent

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
pnpm run db:push

# Start development server
pnpm run dev
```

Visit `http://localhost:3000`

---

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute deployment guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment instructions
- **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** - Environment variables reference

---

## 🎯 Roadmap

- [ ] Web3 wallet integration (MetaMask)
- [ ] BNBChain token-gated features
- [ ] Community gallery for sharing images
- [ ] Token economy for image generation credits
- [ ] Multi-chain support

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

## 💬 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/maxog8/sovereign-agent/issues)
- **Documentation**: See docs folder for detailed guides

---

**Built with ❤️ for the BNBChain ecosystem**
