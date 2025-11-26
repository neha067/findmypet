# Firebase Storage CORS Configuration

## Problem
The application is getting CORS errors when trying to upload images to Firebase Storage:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

## Solution

You need to configure Firebase Storage security rules and CORS settings.

### Option 1: Configure Storage Security Rules (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `kio-portfolio`
3. Navigate to **Storage** → **Rules** tab
4. Update the rules to allow authenticated uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow authenticated users to upload to cats folder
    match /cats/{fileName} {
      allow write: if request.auth != null 
                    && request.resource.size < 5 * 1024 * 1024  // 5MB limit
                    && request.resource.contentType.matches('image/.*');
    }
    
    // Allow authenticated users to upload to posts folder
    match /posts/{postId}/{fileName} {
      allow write: if request.auth != null
                    && request.resource.size < 5 * 1024 * 1024  // 5MB limit
                    && request.resource.contentType.matches('image/.*');
    }
  }
}
```

5. Click **Publish**

### Option 2: Configure CORS via gsutil (If Option 1 doesn't work)

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install

2. Create a CORS configuration file `cors.json`:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

3. Apply CORS configuration:

```bash
gsutil cors set cors.json gs://kio-portfolio.firebasestorage.app
```

### Option 3: Check Firebase Storage Bucket Settings

1. Go to Firebase Console → Storage
2. Click on the **Settings** tab
3. Ensure your bucket has proper permissions
4. Check that CORS is enabled

### Verification

After configuring, test by:
1. Logging in to the app
2. Trying to upload an image via the "Report Missing Cat" or "Report Found Cat" forms
3. Check browser console for CORS errors

## Alternative: Use Firebase Storage REST API with proper headers

If CORS continues to be an issue, we can modify the upload code to use Firebase Admin SDK or configure proper headers.

# need to setup in firebase