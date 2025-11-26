# Database Design Documentation

## Overview
This document describes the Firestore database structure for the FindMyPet application, designed for scalability and real-time updates.

## Collections

### 1. `posts` Collection
Main collection for social media posts about missing/found cats.

**Document Structure:**
```typescript
{
  id: string,                    // Auto-generated document ID
  title: string,                 // e.g., "Missing: Fluffy"
  type: "missing" | "found",     // Post type
  catId: string,                 // Reference to cats collection
  description?: string,          // Optional description
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
- `type` + `createdAt` - For filtering by type

**Scalability Considerations:**
- ✅ **Subcollection for likes**: Prevents loading all likes when fetching posts
- ✅ **Cached like count**: Fast reads without querying subcollection
- ✅ **Denormalized user info**: Reduces queries but needs update strategy
- ⚠️ **Comments subcollection**: Could grow large - consider pagination

---

### 2. `cats` Collection
Collection for cat reports (missing/found).

**Document Structure:**
```typescript
{
  id: string,                    // Auto-generated document ID
  name?: string,                 // Cat name
  color: string,                 // Cat color
  gender?: string,               // "male" | "female" | "unknown"
  age?: string,                  // Age description
  status: "Missing" | "Found",   // Current status
  description?: string,          // Additional details
  location: string,              // Location text
  position: [number, number],    // [latitude, longitude] for map
  latitude: number,              // Duplicate for easier querying
  longitude: number,             // Duplicate for easier querying
  missingDate?: Date,            // When cat went missing
  foundDate?: Date,              // When cat was found
  missingMonth?: string,         // Alternative date format
  missingYear?: string,          // Alternative date format
  imageUrl?: string,             // Cat photo URL
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

**Indexes Required:**
- `createdAt` (descending)
- `status` + `createdAt` - For filtering missing/found
- `latitude` + `longitude` - For geolocation queries (GeoPoint)
- `position` - For map queries

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
    // Posts collection
    match /posts/{postId} {
      allow read: if true; // Public read
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                     request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['likeCount', 'updatedAt']);
      allow delete: if request.auth != null && 
                     resource.data.reportedBy.uid == request.auth.uid;
      
      // Likes subcollection
      match /likes/{userId} {
        allow read: if true;
        allow write: if request.auth != null && 
                      request.auth.uid == userId;
      }
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
                                resource.data.userId == request.auth.uid;
      }
    }
    
    // Cats collection
    match /cats/{catId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
                     resource.data.reportedBy.uid == request.auth.uid;
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

## Questions or Issues?

Refer to this document when:
- Adding new collections
- Optimizing queries
- Planning for scale
- Debugging data consistency issues

