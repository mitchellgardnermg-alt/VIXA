# Video Encoding API Integration

## Configuration

Add these environment variables to your `.env.local` file:

```bash
# Video Encoding API Configuration
VIDEO_ENCODING_API_URL=http://localhost:3000

# Cloudinary Configuration (fallback)
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

## How It Works

1. **Primary**: Uses your local video encoding API (http://localhost:3000)
2. **Fallback**: Uses Cloudinary if local API is unavailable
3. **Final Fallback**: Returns original file if both fail

## Setup Steps

1. **Start your video encoding API**:
   ```bash
   cd "/Users/mitchellgardner/video encoding api "
   npm start
   ```

2. **Add environment variable** to vid-dj-v2/.env.local:
   ```
   VIDEO_ENCODING_API_URL=http://localhost:3000
   ```

3. **Test the integration** by uploading a WebM file in your vid-dj v2 app

## Benefits

- ✅ **No Cloudinary costs** for video conversion
- ✅ **Faster processing** (local vs cloud)
- ✅ **Better privacy** (files stay on your server)
- ✅ **Automatic fallback** to Cloudinary if needed
