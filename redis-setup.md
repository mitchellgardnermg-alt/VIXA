# Redis Setup for Video Conversion Caching

## Local Development

1. **Install Redis locally:**
   ```bash
   # macOS
   brew install redis
   
   # Start Redis
   redis-server
   ```

2. **Environment Variables:**
   Add to your `.env.local`:
   ```
   REDIS_URL=redis://localhost:6379
   ```

## Production Deployment

### Option 1: Redis Cloud (Recommended)
1. Sign up at https://redis.com/
2. Create a free database (30MB)
3. Get connection string
4. Add to environment variables

### Option 2: Vercel Redis
1. Install Vercel Redis addon
2. Configure in Vercel dashboard

### Option 3: Railway Redis
1. Deploy Redis on Railway
2. Get connection string
3. Add to environment variables

## Benefits of Redis Caching

- **Faster conversions**: Cached results return instantly
- **Reduced Cloudinary costs**: Avoid duplicate processing
- **Better user experience**: No waiting for repeated conversions
- **Scalability**: Handle more concurrent users

## Cache Strategy

- **Cache key**: `video_{fileHash}_{width}x{height}`
- **Expiration**: 24 hours
- **Storage**: Base64 encoded MP4 files
- **Size limit**: 50MB per cached file
