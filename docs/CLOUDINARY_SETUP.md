# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image storage in your FindMyPet application.

## 🚀 Quick Start

### Step 1: Sign Up for Cloudinary

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (no credit card required)
3. Verify your email address

### Step 2: Get Your Credentials

After signing up, you'll be taken to your dashboard. You'll need:

1. **Cloud Name** - Found in your dashboard (e.g., `dmo8hq1p3`)
2. **API Key** - Available in dashboard (optional for unsigned uploads)
3. **API Secret** - Available in dashboard (optional for unsigned uploads)

### Step 3: Create an Upload Preset

1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `findmypet-unsigned` (or any name you prefer)
   - **Signing mode**: Select **Unsigned** (this allows client-side uploads)
   - **Folder**: `pets` (optional - organizes your uploads)
   - **Format**: `Auto` (automatically converts to best format - configure here, not in code)
   - **Quality**: `Auto` (optimizes quality automatically - configure here, not in code)
   - Click **Save**
   
   **Note:** Transformations are configured in the preset itself, not sent in the upload request. This is the correct and secure way to handle it.

### Step 4: Configure Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=findmypet-unsigned
```

**Important:**
- Replace `your_cloud_name_here` with your actual Cloud Name from Step 2
- Replace `findmypet-unsigned` with the preset name you created in Step 3
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- Never commit `.env.local` to git (it should already be in `.gitignore`)

### Step 5: Restart Your Development Server

After adding the environment variables, restart your Next.js dev server:

```bash
npm run dev
```

## ✅ Verification

To verify everything is working:

1. Try creating a new post with an image
2. Check your Cloudinary dashboard → **Media Library** to see the uploaded image
3. The image should appear in your post

## 📊 Free Tier Limits

Cloudinary's free tier includes:

- ✅ **25 GB storage**
- ✅ **25 GB bandwidth/month**
- ✅ **25,000 monthly transform requests**
- ✅ **Free CDN** (global content delivery network)
- ✅ **Automatic image optimization**

## 🔧 Features

With Cloudinary, you get:

1. **Automatic Format Conversion**: Images are automatically converted to WebP or AVIF for smaller file sizes
2. **Quality Optimization**: Images are compressed without noticeable quality loss
3. **Global CDN**: Images are served from the nearest location to users
4. **Transformations**: You can resize, crop, and apply filters to images on-the-fly

## 🛠️ Troubleshooting

### Error: "Cloudinary cloud name is not configured"

**Solution:** Make sure you've added `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to your `.env.local` file and restarted your dev server.

### Error: "Cloudinary upload preset is not configured"

**Solution:** 
1. Check that you've created an upload preset in Cloudinary dashboard
2. Verify the preset is set to "Unsigned" mode
3. Make sure `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in `.env.local` matches the preset name exactly

### Error: "Upload failed with status 400"

**Solution:** 
1. Check that your upload preset name matches exactly (case-sensitive)
2. Verify the preset is set to "Unsigned" mode
3. Check file size (max 10MB for free tier)

### Images Not Showing

**Solution:**
1. Check your browser console for errors
2. Verify the image URL is a Cloudinary URL (should start with `https://res.cloudinary.com/`)
3. Make sure `next.config.ts` includes Cloudinary in `remotePatterns` (already configured)

## 📝 Migration from Firebase Storage

The code has been updated to use Cloudinary instead of Firebase Storage. Existing images stored in Firebase will continue to work, but new uploads will use Cloudinary.

To migrate existing images:
1. Export images from Firebase Storage
2. Upload them to Cloudinary manually (or write a migration script)
3. Update image URLs in your Firestore database

## 🔒 Security Notes

- The upload preset is set to "Unsigned" which allows client-side uploads
- To restrict uploads, you can:
  - Create signed uploads (requires server-side API)
  - Add upload restrictions in Cloudinary settings
  - Set up upload size limits in the preset

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

## 🎉 You're All Set!

Once configured, Cloudinary will handle all image uploads automatically. The images will be:
- Optimized for web (smaller file sizes)
- Served via CDN (faster loading)
- Automatically converted to modern formats (WebP/AVIF)

Happy uploading! 🚀

