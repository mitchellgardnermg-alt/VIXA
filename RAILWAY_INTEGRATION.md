# Railway Video Encoding API Integration

## Environment Variables

Add this to your `.env.local` file:

```bash
# Video Encoding API Configuration
VIDEO_ENCODING_API_URL=https://vea-production.up.railway.app

# Your existing Cloudinary variables (if any)
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

## How It Works

1. **Primary**: Uses your Railway API for video conversion
2. **Fallback**: Falls back to Cloudinary if Railway fails
3. **Final Fallback**: Returns original file if both fail

## Testing

1. Set the environment variable
2. Start your app: `npm run dev`
3. Upload a WebM file
4. Check console logs for "Using local video encoding API for conversion"

## Railway API Endpoints

- **Health**: https://vea-production.up.railway.app/health
- **Convert**: https://vea-production.up.railway.app/convert
- **Download**: https://vea-production.up.railway.app/download/:filename

