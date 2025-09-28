# Deployment Guide

## 🚀 Quick Deploy to Vercel

### Step 1: Push to GitHub

1. **Create a new repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name it `vid-dj-v2` or your preferred name
   - Make it public or private (your choice)

2. **Push your code**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/vid-dj-v2.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add these in Vercel dashboard:
   ```
   STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   REDIS_URL=your_redis_cloud_url
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get your live URL (e.g., `https://vid-dj-v2.vercel.app`)

### Step 3: Configure Stripe

1. **Update Stripe Products**
   - Go to Stripe Dashboard → Products
   - Create Pro plan: $8.99/month
   - Create Lifetime plan: $44.99 one-time
   - Copy the price IDs

2. **Update Code**
   - Edit `src/lib/stripe.ts`
   - Replace `STRIPE_PRICE_IDS` with your actual price IDs

3. **Set Up Webhooks**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret to Vercel environment variables

### Step 4: Configure Video Encoding API

1. **Railway Video Encoding Service**
   - The app uses Railway's video encoding service at `https://vea-production.up.railway.app`
   - No additional configuration needed - the service is already set up
   - Video conversion is handled automatically

2. **Test Video Conversion**
   - Record a video in your app
   - Test the MP4 conversion
   - Verify it works correctly
   - The Railway service handles all video processing

## 🔧 Production Checklist

### Environment Variables
- [ ] `STRIPE_SECRET_KEY` (live key)
- [ ] `STRIPE_PUBLISHABLE_KEY` (live key)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `VIDEO_ENCODING_API_URL` (defaults to Railway service)
- [ ] `NEXT_PUBLIC_APP_URL` (your domain)
- [ ] `REDIS_URL` (optional, for caching)

### Stripe Configuration
- [ ] Create Pro product ($8.99/month)
- [ ] Create Lifetime product ($44.99 one-time)
- [ ] Set up webhook endpoint
- [ ] Test payment flow
- [ ] Update price IDs in code

### Domain Setup
- [ ] Custom domain (optional)
- [ ] SSL certificate (automatic with Vercel)
- [ ] Update `NEXT_PUBLIC_APP_URL`

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor Stripe webhooks
- [ ] Track conversion rates
- [ ] Monitor Cloudinary usage

## 📊 Analytics Setup

### Vercel Analytics
1. Enable Vercel Analytics in dashboard
2. Track page views and performance
3. Monitor Core Web Vitals

### Stripe Analytics
1. Monitor subscription metrics
2. Track revenue and churn
3. Set up alerts for failed payments

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
- Check environment variables
- Verify all dependencies are installed
- Check for TypeScript errors

**Stripe Webhook Issues**
- Verify webhook URL is correct
- Check webhook secret matches
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Video Conversion Issues**
- Check Railway video encoding service status
- Verify file size limits
- Monitor conversion performance

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev
```

## 🔄 Updates and Maintenance

### Regular Updates
1. **Dependencies**: `npm update`
2. **Security patches**: `npm audit fix`
3. **Feature updates**: Git pull and deploy

### Monitoring
- Check Vercel dashboard for build status
- Monitor Stripe dashboard for payments
- Track Railway video encoding service performance
- Monitor Redis usage (if using)

## 💰 Cost Optimization

### Vercel
- Free tier: 100GB bandwidth/month
- Pro tier: $20/month for more bandwidth
- Monitor usage in dashboard

### Stripe
- 2.9% + 30¢ per transaction
- No monthly fees
- Monitor in Stripe dashboard

### Railway Video Encoding
- Uses Railway's video encoding service
- No additional costs for video processing
- Service handles all video conversion automatically

### Redis (Optional)
- Free tier: 30MB
- Pro tier: $7/month for more storage
- Only needed for caching

## 🎯 Performance Optimization

### Next.js
- Enable static generation where possible
- Optimize images with Next.js Image
- Use dynamic imports for heavy components

### Video Processing
- Compress videos before upload
- Use appropriate quality settings
- Railway service handles all video processing

### CDN
- Vercel provides global CDN
- Railway provides video processing CDN
- Monitor performance metrics

## 📈 Scaling

### When to Scale
- 100+ daily users
- 50+ exports per day
- High video processing load
- Slow conversion times

### Scaling Options
1. **Vercel Pro**: More bandwidth and functions
2. **Railway Pro**: Higher video processing limits
3. **Redis Cloud**: Better caching
4. **CDN**: Global content delivery

---

Your app is now ready for production! 🎉
