# Database Design Documentation

## Overview
This document describes the Firestore database structure for the FindMyPet application, designed for scalability and real-time updates.

## Collections

### 1. `posts` Collection
Main collection for social media posts about missing/found cats, adoption posts, and general social posts.

**Document Structure:**
```typescript
{
  id: string,                    // Auto-generated document ID
  title: string,                 // e.g., "Missing: Fluffy", "Adoption: Luna", or user-generated caption
  type: "missing" | "found" | "adoption" | "social",  // Post type
  petType?: "cat" | "dog" | "other",  // Type of pet (optional - for missing/found/adoption posts)
  catId?: string,                // Reference to cats collection (optional - not used for "social" posts)
  description?: string,          // Optional description/caption
  imageUrl?: string,             // URL to uploaded image
  reportedBy: {
    uid: string,                 // User ID
    name: string,                // Display name
    email: string                // User email
  },
  createdAt: Timestamp,          // Creation timestamp
  likeCount: number,             // Cached like count (for performance)
  updatedAt?: Timestamp          // Last update timestamp
}
```

**Post Type Details:**
- `"missing"`: Report of a missing cat - requires cat document and appears on map
- `"found"`: Report of a found cat - requires cat document and appears on map
- `"adoption"`: Cat available for adoption - requires cat document and appears on map
- `"social"`: General social post - no cat document, only appears in timeline feed

**Subcollections:**
- `posts/{postId}/likes/{userId}` - Individual like documents
  ```typescript
  {
    userId: string,              // User who liked
    likedAt: Timestamp           // When they liked
  }
  ```
  
- `posts/{postId}/comments/{commentId}` - Comments on posts
  ```typescript
  {
    userId: string,              // User ID
    userName: string,            // Display name
    userPhoto?: string,          // Profile photo URL
    text: string,                // Comment text
    createdAt: Timestamp         // Comment timestamp
  }
  ```

**Indexes Required:**
- `createdAt` (descending) - For timeline ordering
- `likeCount` (descending) - For popular posts
- `type` + `createdAt` - For filtering by type (supports: missing, found, adoption, social)
- `catId` - For posts linked to cats (nullable)

**Scalability Considerations:**
- ✅ **Subcollection for likes**: Prevents loading all likes when fetching posts
- ✅ **Cached like count**: Fast reads without querying subcollection
- ✅ **Denormalized user info**: Reduces queries but needs update strategy
- ⚠️ **Comments subcollection**: Could grow large - consider pagination

---

### 2. `cats` Collection (Legacy name - supports all pet types)
Collection for pet reports (missing/found/adoption). Supports cats, dogs, and other animals. Note: Social posts do not create pet documents.

**Document Structure:**
```typescript
{
  id: string,                    // Auto-generated document ID
  petType: "cat" | "dog" | "other",  // Type of pet (REQUIRED)
  name?: string,                 // Pet name (optional for found pets)
  color: string,                 // Pet color/coat color
  gender?: string,               // "male" | "female" | "unknown"
  age?: string,                  // Age description (varies by pet type)
  status: "missing" | "found" | "adoption",  // Current status (lowercase)
  description?: string,          // Additional details
  location: string,              // Location text
  position: [number, number],    // [latitude, longitude] for map
  latitude: number,              // Duplicate for easier querying
  longitude: number,             // Duplicate for easier querying
  missingDate?: Date,            // When pet went missing
  foundDate?: Date,              // When pet was found
  missingMonth?: string,         // Alternative date format
  missingYear?: string,          // Alternative date format
  foundMonth?: string,           // Alternative date format for found pets
  foundYear?: string,            // Alternative date format for found pets
  imageUrl?: string,             // Pet photo URL
  daysAgo: number,               // Calculated days since event
  reportedBy: {
    uid: string,
    name: string,
    email: string
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  likeCount: number              // Same as posts
}
```

**Pet Type Details:**
- `"cat"`: Cats - age options: kitten, young, adult, senior
- `"dog"`: Dogs - age options: puppy, young, adult, senior
- `"other"`: Other animals (birds, rabbits, etc.) - age options: young, adult, senior

**Indexes Required:**
- `createdAt` (descending)
- `petType` + `createdAt` - For filtering by pet type
- `status` + `createdAt` - For filtering missing/found/adoption
- `petType` + `status` + `createdAt` - For filtering by pet type and status
- `latitude` + `longitude` - For geolocation queries (GeoPoint)
- `position` - For map queries
- `status` + `color` + `createdAt` - For filtering by status and color
- `status` + `age` + `createdAt` - For filtering by status and age
- `petType` + `status` + `color` + `createdAt` - For filtering by pet type, status, and color

**Scalability Considerations:**
- ✅ **Geolocation fields**: Supports efficient location-based queries
- ⚠️ **No subcollections**: Simpler but could need reports subcollection if multiple reports per cat
- ✅ **Denormalized coordinates**: Supports both array and separate field access

---

## Scalability Best Practices

### ✅ Implemented
1. **Subcollections for large data**: Likes and comments use subcollections
2. **Cached counters**: `likeCount` is cached on parent document
3. **Denormalized user data**: Reduces query complexity
4. **Atomic transactions**: Like operations use transactions for consistency

### 🔄 Recommended Improvements

1. **Pagination for Comments**
   ```typescript
   // Add pagination to comment queries
   const commentsQuery = query(
     commentsRef,
     orderBy("createdAt", "desc"),
     limit(10),
     startAfter(lastDoc)
   );
   ```

2. **Composite Indexes**
   - Create composite indexes in Firebase Console for:
     - `status` + `createdAt` + `position`
     - `type` + `likeCount` + `createdAt`
     - `status` + `color` + `createdAt` (for cats collection)
     - `status` + `age` + `createdAt` (for cats collection)
     - `type` + `createdAt` (for posts collection, supports: missing, found, adoption, social)

3. **Rate Limiting**
   - Implement Cloud Functions to prevent spam
   - Add daily limits per user

4. **Data Archiving**
   - Archive old posts (> 1 year) to separate collection
   - Keep only active/recent posts in main collection

5. **Full-Text Search**
   - Consider Algolia or Elasticsearch for name/description search
   - Or use Firestore's new vector search capabilities

---

## Transaction Examples

### Like Post (Current Implementation)
```typescript
await runTransaction(db, async (transaction) => {
  const postSnap = await transaction.get(postRef);
  const likeSnap = await transaction.get(likeRef);
  
  if (!likeSnap.exists()) {
    transaction.set(likeRef, { likedAt: serverTimestamp() });
    transaction.update(postRef, { likeCount: increment(1) });
  } else {
    transaction.delete(likeRef);
    transaction.update(postRef, { likeCount: increment(-1) });
  }
});
```

**Benefits:**
- ✅ Atomic operations (all-or-nothing)
- ✅ Prevents race conditions
- ✅ Ensures data consistency

---

## Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function to validate post type
    function isValidPostType(type) {
      return type in ['missing', 'found', 'adoption', 'social'];
    }
    
    // Helper function to validate cat status
    function isValidCatStatus(status) {
      return status in ['missing', 'found', 'adoption'];
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if true; // Public read
      
      allow create: if isAuthenticated() 
                     && isValidPostType(request.resource.data.type)
                     && request.resource.data.reportedBy.uid == request.auth.uid
                     && request.resource.data.likeCount == 0
                     && request.resource.data.createdAt != null;
      
      allow update: if isAuthenticated() 
                     && request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['likeCount', 'updatedAt']);
      
      allow delete: if isAuthenticated() 
                     && resource.data.reportedBy.uid == request.auth.uid;
      
      // Likes subcollection
      match /likes/{userId} {
        allow read: if true;
        allow write: if isAuthenticated() && request.auth.uid == userId;
      }
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update, delete: if isAuthenticated() 
                                && resource.data.userId == request.auth.uid;
      }
    }
    
    // Cats collection
    match /cats/{catId} {
      allow read: if true;
      
      allow create: if isAuthenticated()
                     && isValidCatStatus(request.resource.data.status)
                     && request.resource.data.reportedBy.uid == request.auth.uid
                     && request.resource.data.likeCount == 0
                     && request.resource.data.createdAt != null;
      
      allow update: if isAuthenticated();
      
      allow delete: if isAuthenticated() 
                     && resource.data.reportedBy.uid == request.auth.uid;
    }
  }
}
```

---

## Performance Metrics

### Expected Query Performance
- **Fetch posts**: ~50-100ms (with index)
- **Fetch likes**: ~10ms per post (subcollection query)
- **Fetch comments**: ~20-50ms (paginated)
- **Geolocation query**: ~100-200ms (depending on radius)

### Scaling Targets
- **10K users**: ✅ Current design handles easily
- **100K users**: ✅ Should handle with proper indexing
- **1M users**: ⚠️ May need sharding or additional optimizations

---

## Migration Notes

If you need to migrate or update the schema:

1. **Add new fields**: Use Firestore's merge behavior
2. **Remove fields**: Write migration script to clean up
3. **Reindex**: Update indexes in Firebase Console
4. **Backup**: Always backup before major migrations

---

## Backend Services

The application includes backend service layers in the `lib/` directory:

- **`lib/postService.ts`**: Service for creating and validating posts
- **`lib/catService.ts`**: Service for creating and validating cat documents  
- **`lib/postCatIntegration.ts`**: Unified service for creating posts with optional cat documents

These services handle:
- Data validation
- Type checking
- Error handling
- Business logic for different post types

See `BACKEND_INTEGRATION.md` for detailed usage instructions.

---

## Questions or Issues?

Refer to this document when:
- Adding new collections
- Optimizing queries
- Planning for scale
- Debugging data consistency issues

For backend integration questions, see `BACKEND_INTEGRATION.md`.

