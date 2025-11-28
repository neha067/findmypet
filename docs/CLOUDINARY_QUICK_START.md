# Cloudinary Quick Start Guide 🚀

## ✅ Your Cloudinary Account Info

From your credentials, here's what we have:
- **Cloud Name**: `dww0bnqph`
- **API Key**: `714971366857565`
- **API Secret**: `0c-DhNVfapYYx1z70CybKAYp3-I`

## 📝 Step 1: Create Upload Preset (IMPORTANT!)

**For unsigned uploads, you MUST create an upload preset first:**

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/settings/upload)
2. Click **Settings** → **Upload**
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Configure it:
   ```
   Preset name: findmypet-unsigned
   Signing mode: Unsigned  ← IMPORTANT!
   Folder: pets
   Format: Auto
   Quality: Auto
   ```
6. Click **Save**

## 🔧 Step 2: Add Environment Variables

Add these lines to your `.env.local` file (create it if it doesn't exist):

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dww0bnqph
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=findmypet-unsigned
```

**Note:** 
- Replace `findmypet-unsigned` with the preset name you created in Step 1
- The API Key and Secret are NOT needed for unsigned uploads
- Make sure `.env.local` exists (it's already in `.gitignore`)

## 🚀 Step 3: Restart Your Server

```bash
npm run dev
```

## ✅ Step 4: Test It!

1. Create a new post with an image
2. Upload should work automatically
3. Check Cloudinary dashboard → Media Library to see your image

## 🔒 Security Notes

**Keep these private:**
- API Secret: `0c-DhNVfapYYx1z70CybKAYp3-I`
- API Key: `714971366857565`

- ❌ Never commit these to git
- ❌ Never expose in client-side code
- ✅ Only needed for signed uploads (not our current setup)

## 🎉 You're Done!

That's it! Cloudinary is now configured. All new image uploads will use Cloudinary instead of Firebase Storage.

---

**Troubleshooting:**
- If upload fails, check that the upload preset is set to "Unsigned"
- Verify environment variable names match exactly (case-sensitive)
- Restart your dev server after adding env vars

