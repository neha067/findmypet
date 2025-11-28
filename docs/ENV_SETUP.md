# Environment Variables Setup for Cloudinary

## ✅ Your Cloudinary Credentials

From your Cloudinary account:
- **Cloud Name**: `dww0bnqph`
- **API Key**: `714971366857565`
- **API Secret**: `0c-DhNVfapYYx1z70CybKAYp3-I`

## 📝 Required Environment Variables

For **unsigned uploads** (what we're using), you only need:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dww0bnqph
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name_here
```

**Note:** The API Key and API Secret are NOT needed for unsigned uploads. They're only used for signed uploads or server-side operations.

## 🚀 Setup Instructions

### Step 1: Create Upload Preset in Cloudinary

1. Go to your Cloudinary Dashboard: https://console.cloudinary.com/
2. Navigate to **Settings** → **Upload**
3. Scroll to **Upload presets** section
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `findmypet-unsigned` (or any name you prefer)
   - **Signing mode**: Select **Unsigned** ⚠️ (This is important!)
   - **Folder**: `pets` (optional, helps organize uploads)
   - **Format**: `Auto`
   - **Quality**: `Auto`
   - Click **Save**

### Step 2: Add to .env.local

Create or update `.env.local` in your project root:

```bash
# Cloudinary Configuration (for unsigned uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dww0bnqph
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=findmypet-unsigned

# Your existing Firebase config (if any)
# ... other env vars ...
```

**Important:**
- Replace `findmypet-unsigned` with the actual preset name you created
- The file should be named `.env.local` (not `.env.development`)
- Make sure `.env.local` is in your `.gitignore`

### Step 3: Restart Dev Server

```bash
npm run dev
```

## 🔍 Verify Setup

1. Try uploading an image when creating a post
2. Check Cloudinary dashboard → Media Library
3. Image should appear in the `pets` folder

## ⚠️ Security Note

The API Secret (`0c-DhNVfapYYx1z70CybKAYp3-I`) is sensitive! 

- ❌ **Never** add it to client-side code
- ❌ **Never** commit it to git
- ❌ **Never** expose it in browser console
- ✅ Only use it for server-side operations (if needed later)

For unsigned uploads (current implementation), you don't need it at all!

## 🎉 You're Ready!

Once you've created the upload preset and added the environment variables, Cloudinary is ready to use!

