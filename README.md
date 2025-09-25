# Vixa - AI-Powered Visual DJ

A real-time audio-reactive visual application that transforms music into stunning visual experiences. Built with Next.js, React, and WebGL.

## ✨ Features

- **Real-time Audio Analysis** - Reacts to low, mid, and high frequencies
- **Multiple Visual Modes** - Smoke, waveform, and more
- **Social Media Ready** - Export in YouTube, TikTok, Instagram formats
- **MP4 Conversion** - Cloudinary-powered video processing
- **Subscription Tiers** - Free, Pro, and Lifetime plans
- **Preview System** - Review recordings before export

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API
- **Graphics**: Canvas 2D API, Three.js
- **Payments**: Stripe
- **Video Processing**: Cloudinary
- **Authentication**: Clerk
- **State Management**: Zustand

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vid-dj-v2.git
   cd vid-dj-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```bash
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Redis Configuration (optional)
   REDIS_URL=redis://localhost:6379
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Stripe Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Create products for Pro ($8.99/month) and Lifetime ($44.99) plans
4. Set up webhooks for subscription events
5. See `stripe-setup.md` for detailed instructions

### Cloudinary Setup
1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Update the configuration in `src/app/api/convert/route.ts`

### Redis Setup (Optional)
1. Install Redis locally: `brew install redis`
2. Start Redis: `redis-server`
3. Or use Redis Cloud for production

## 📱 Usage

1. **Load Audio** - Upload a file or use your microphone
2. **Choose Visual Mode** - Select from available visual modes
3. **Record** - Click record to capture your performance
4. **Preview** - Review your recording before export
5. **Export** - Download in your preferred format and aspect ratio

## 💰 Subscription Plans

- **Free**: 3 exports/day, all features
- **Pro**: $8.99/month, 20 exports/day, priority processing
- **Lifetime**: $44.99 one-time, unlimited exports, all future features

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Set Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure `NEXT_PUBLIC_APP_URL` is set to your domain

3. **Deploy**
   - Vercel will automatically deploy on every push
   - Custom domain setup available

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── convert/      # Video conversion
│   │   └── stripe/       # Payment processing
│   ├── app/              # Main application
│   └── landing/          # Landing page
├── components/           # React components
├── hooks/               # Custom hooks
├── lib/                 # Utilities and configurations
├── store/               # Zustand stores
└── types/               # TypeScript types
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Files

- `src/app/app/page.tsx` - Main application
- `src/components/Mixer.tsx` - Visual mode controls
- `src/components/OptimizedCanvas.tsx` - Canvas rendering
- `src/hooks/useAudioAnalyser.ts` - Audio analysis
- `src/store/useAppStore.ts` - Application state
- `src/store/useSubscriptionStore.ts` - Subscription state

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs folder
- **Issues**: Create an issue on GitHub
- **Email**: support@vixa.app

## 🎯 Roadmap

- [ ] More visual modes
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] Advanced audio effects
- [ ] Custom visual editor
- [ ] Social sharing features

---

Built with ❤️ by the Vixa team