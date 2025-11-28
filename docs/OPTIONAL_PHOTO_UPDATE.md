# Optional Photo & Default Images Update

## ✅ Changes Completed

### 1. Photo Made Optional
- ✅ **CreatePostForm.tsx**: Removed `required` attribute from image inputs
- ✅ **FoundForm.tsx**: Photo already optional (labeled as "Optional")
- ✅ Added helper text: "No photo selected. A default image will be used..."

### 2. Default Images Based on Pet Type
- ✅ Created `lib/defaultImages.ts` with helper functions:
  - `getDefaultPetImage(petType)` - Returns default image based on pet type
  - `getDefaultPostImage()` - Returns default for social posts
  - `getImageUrl(imageUrl, petType)` - Gets image or default if missing

- ✅ Default image paths:
  - **Cat**: `/assets/default-cat.jpg`
  - **Dog**: `/assets/default-dog.jpg`
  - **Other**: `/assets/default-other.jpg`
  - **Social posts**: `/assets/test1.jpeg` (general default)

### 3. Default Images Created
- ✅ Created placeholder default images:
  - `public/assets/default-cat.jpg`
  - `public/assets/default-dog.jpg`
  - `public/assets/default-other.jpg`

### 4. Form Updates
- ✅ **CreatePostForm.tsx**:
  - Photo field now optional (removed `required`)
  - Default image logic: uses pet type-specific default if no image uploaded
  - Works for both non-social and social posts

- ✅ **FoundForm.tsx**:
  - Photo already optional
  - Default image logic added based on pet type

### 5. PostCard Updates
- ✅ **PostCard.tsx**:
  - Always displays an image (never empty)
  - Uses default image based on pet type if imageUrl is missing
  - Fetches petType from post or linked cat document
  - Updated to use `getImageUrl()` helper

### 6. Image Always Set
- ✅ All forms ensure `imageUrl` is always set (either uploaded or default)
- ✅ No empty imageUrl values saved to database
- ✅ Posts always have an image to display

## Default Image Logic

### When Default Images Are Used:
1. **User doesn't upload a photo** - Uses default based on pet type
2. **Image upload fails** - Uses default as fallback
3. **Social posts without image** - Uses general default image

### Default Image Selection:
```typescript
// For pets with type
if (petType === "cat") return "/assets/default-cat.jpg"
if (petType === "dog") return "/assets/default-dog.jpg"
if (petType === "other") return "/assets/default-other.jpg"

// For social posts or unknown
return "/assets/test1.jpeg"
```

## Files Modified

1. ✅ `lib/defaultImages.ts` - Created helper functions
2. ✅ `app/Social/components/CreatePostForm.tsx` - Made photo optional, added defaults
3. ✅ `app/Social/components/FoundForm.tsx` - Added default image logic
4. ✅ `components/PostCard.tsx` - Always shows image, uses defaults
5. ✅ `app/Social/page.tsx` - Passes petType to PostCard
6. ✅ Created default image files in `public/assets/`

## Notes

- **Placeholder Images**: Current default images are copies of `test1.jpeg`. Replace with actual pet-specific default images later.
- **Image Always Displayed**: Posts will always show an image (never empty/broken)
- **Pet Type Detection**: PostCard tries to get petType from:
  1. Direct `post.petType` field
  2. Linked cat document (`post.catId` → `cat.petType`)
  
## Next Steps (Optional)

1. Replace placeholder default images with actual pet images:
   - Create/design default-cat.jpg
   - Create/design default-dog.jpg
   - Create/design default-other.jpg

2. Test with posts without photos to verify defaults work

3. Consider adding image validation/optimization for uploaded images

## Testing Checklist

- [ ] Create post without photo - verify default image appears
- [ ] Create cat post without photo - verify cat default
- [ ] Create dog post without photo - verify dog default
- [ ] Create other pet post without photo - verify other default
- [ ] Create social post without photo - verify general default
- [ ] Verify PostCard always displays an image
- [ ] Test with existing posts that have no imageUrl

