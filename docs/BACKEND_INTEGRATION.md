# Backend Integration Guide

This document describes the backend services and how to integrate them with the frontend forms.

## Overview

The backend integration layer provides services for:
- **Post Operations** (`lib/postService.ts`): Creating and managing posts
- **Cat Operations** (`lib/catService.ts`): Creating and managing cat documents
- **Integrated Operations** (`lib/postCatIntegration.ts`): Unified service that handles both posts and cats based on post type

## New Post Types

The application now supports four post types:
1. **`missing`**: Report of a missing cat - creates both cat document and post
2. **`found`**: Report of a found cat - creates both cat document and post
3. **`adoption`**: Cat available for adoption - creates both cat document and post
4. **`social`**: General social post - creates ONLY post document (no cat document)

## Backend Services

### 1. Post Service (`lib/postService.ts`)

Provides functions for creating and validating posts.

#### Key Functions:

```typescript
import { createPost, createPostWithAutoTitle, validatePostData, generatePostTitle } from '@/lib/postService';

// Create a post with full control
const postRef = await createPost({
  type: "missing",
  title: "Missing: Fluffy",
  description: "Last seen near downtown",
  imageUrl: "https://...",
  catId: "cat123",
  reportedBy: {
    uid: user.uid,
    name: user.displayName,
    email: user.email
  }
});

// Create a post with auto-generated title
const postRef = await createPostWithAutoTitle("social", {
  description: "Cute cat photo!",
  imageUrl: "https://...",
  reportedBy: userInfo
});

// Validate post data before creation
const validation = validatePostData(postData);
if (!validation.valid) {
  console.error(validation.error);
}
```

### 2. Cat Service (`lib/catService.ts`)

Provides functions for creating and validating cat documents.

#### Key Functions:

```typescript
import { createCat, validateCatData, getUserInfo } from '@/lib/catService';

// Create a cat document
const catRef = await createCat({
  status: "missing",
  name: "Fluffy",
  color: "orange",
  gender: "male",
  age: "adult",
  description: "Very friendly cat",
  location: "Downtown",
  latitude: 12.9716,
  longitude: 77.5946,
  missingDate: new Date(),
  imageUrl: "https://...",
  reportedBy: {
    uid: user.uid,
    name: user.displayName,
    email: user.email
  }
});

// Validate cat data
const validation = validateCatData(catData);
if (!validation.valid) {
  console.error(validation.error);
}
```

### 3. Integrated Service (`lib/postCatIntegration.ts`)

**Recommended for form submissions** - Handles the complete flow of creating posts and cats based on post type.

#### Key Function:

```typescript
import { createIntegratedPost } from '@/lib/postCatIntegration';

// For social posts (no cat document)
const result = await createIntegratedPost({
  postType: "social",
  description: "Check out this cute cat!",
  imageUrl: "https://...",
  user: currentUser
});
// result.postRef - created post reference
// result.catRef - undefined for social posts

// For missing/found/adoption posts (creates both cat and post)
const result = await createIntegratedPost({
  postType: "missing",
  name: "Fluffy",
  color: "orange",
  gender: "male",
  age: "adult",
  description: "Last seen near downtown",
  location: "Downtown",
  latitude: 12.9716,
  longitude: 77.5946,
  missingDate: new Date("2024-01-15"),
  imageUrl: "https://...",
  user: currentUser
});
// result.postRef - created post reference
// result.catRef - created cat reference
```

## Integration with Forms

### CreatePostForm Integration

The `CreatePostForm` component should use `createIntegratedPost` for form submissions:

```typescript
import { createIntegratedPost } from '@/lib/postCatIntegration';

// In handleSubmit function:
try {
  const result = await createIntegratedPost({
    postType: formData.postType,
    // For social posts
    description: formData.description,
    imageUrl: imageUrl,
    // For other post types
    name: formData.name,
    color: formData.color,
    gender: formData.gender,
    age: formData.age,
    location: formData.location,
    latitude: parseFloat(formData.latitude),
    longitude: parseFloat(formData.longitude),
    missingDate: missingDateObj,
    foundDate: foundDateObj,
    missingMonth: formData.missingMonth,
    missingYear: formData.missingYear,
    foundMonth: formData.foundMonth,
    foundYear: formData.foundYear,
    imageUrl: imageUrl,
    user: user
  });
  
  // Success - redirect or show success message
  console.log("Post created:", result.postRef.id);
  if (result.catRef) {
    console.log("Cat document created:", result.catRef.id);
  }
} catch (error) {
  console.error("Error creating post:", error);
  // Handle error
}
```

### FoundForm Integration

Similar to CreatePostForm, use `createIntegratedPost`:

```typescript
const result = await createIntegratedPost({
  postType: "found",
  color: formData.color,
  gender: formData.gender,
  age: formData.age,
  description: formData.description,
  location: formData.location,
  latitude: lat,
  longitude: lng,
  foundDate: foundDateObj,
  foundMonth: formData.foundMonth,
  foundYear: formData.foundYear,
  imageUrl: imageUrl,
  user: user
});
```

## Data Validation

All services include built-in validation:

1. **Post Validation**:
   - Validates post type is one of: missing, found, adoption, social
   - Ensures title is provided
   - Validates catId is present for non-social posts
   - Validates catId is NOT present for social posts
   - Validates user information

2. **Cat Validation**:
   - Validates status is one of: missing, found, adoption
   - Ensures color is provided
   - Ensures name is provided for missing/adoption cats
   - Validates location and coordinates
   - Validates user information

## Error Handling

All service functions throw errors with descriptive messages:

```typescript
try {
  const result = await createIntegratedPost(data);
} catch (error: any) {
  if (error.message.includes("Firestore is not initialized")) {
    // Handle Firebase initialization error
  } else if (error.message.includes("Invalid")) {
    // Handle validation error
  } else {
    // Handle other errors
  }
}
```

## Migration Notes

### Existing Data

- Existing posts with type "missing" or "found" will continue to work
- New posts can use types "adoption" or "social"
- Status field in cats collection now uses lowercase: "missing", "found", "adoption" (instead of "Missing", "Found")

### Recommended Index Updates

Add these indexes in Firebase Console:

1. **Posts Collection**:
   - `type` + `createdAt` (composite index)
   - `catId` (single field index, nullable)

2. **Cats Collection**:
   - `status` + `color` + `createdAt` (composite index)
   - `status` + `age` + `createdAt` (composite index)

## Security Rules

See `DATABASE_DESIGN.md` for updated security rules that support the new post types.

## Testing

When testing the integration:

1. **Social Posts**: Verify that only post documents are created (no cat documents)
2. **Other Posts**: Verify that both cat and post documents are created
3. **Validation**: Test with invalid data to ensure proper error messages
4. **Relationships**: Verify that posts are properly linked to cat documents via `catId`

## Benefits of Backend Services

1. **Consistency**: All data creation goes through validated services
2. **Type Safety**: TypeScript types ensure correct data structures
3. **Error Handling**: Centralized error handling and validation
4. **Maintainability**: Easy to update business logic in one place
5. **Testing**: Services can be unit tested independently

