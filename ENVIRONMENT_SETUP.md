# Environment Setup Guide

## Firebase Configuration

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "learning-portal")
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Set up Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select location closest to your users
5. Click "Done"

### Step 3: Enable Authentication
1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication
5. Save changes

### Step 4: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>) to add web app
4. Register app with nickname (e.g., "learning-portal-web")
5. Copy the configuration values

### Step 5: Configure Environment Variables

The `.env` file has been created with the following variables:

```env
# Required Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=1:your_messaging_sender_id:web:your_app_id_here

# Optional Configuration
REACT_APP_USE_FIREBASE_PROD=true
REACT_APP_DEBUG_MODE=true
```

### Environment Variables Explanation

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Authentication domain | `learning-portal-12345.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID | `learning-portal-12345` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Storage bucket URL | `learning-portal-12345.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Cloud messaging sender ID | `123456789012` |
| `REACT_APP_FIREBASE_APP_ID` | Web app ID | `1:123456789012:web:abcdef1234567890` |
| `REACT_APP_USE_FIREBASE_PROD` | Use production Firebase | `true` or `false` |
| `REACT_APP_DEBUG_MODE` | Enable debug logging | `true` or `false` |

### Step 6: Security Rules (Production)

For production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 7: Verify Setup

1. Replace placeholder values in `.env` with your actual Firebase config
2. Restart your development server: `npm start`
3. Open browser console and look for:
   - `User authenticated: [user-id]` 
   - `Hybrid database initialized`
4. Test activity completion to verify storage works

### Troubleshooting

#### Common Issues:

**1. "Firebase authentication failed"**
- Check API key and project ID are correct
- Ensure Anonymous authentication is enabled in Firebase Console

**2. "Permission denied" errors**
- Verify Firestore rules allow anonymous users
- Check project ID matches in config

**3. "Network error" or timeouts**
- Check internet connection
- Verify Firebase project is active and not suspended

**4. Environment variables not loading**
- Ensure `.env` file is in project root
- Restart development server after changes
- Variables must start with `REACT_APP_`

### Development vs Production

#### Development Setup:
```env
REACT_APP_USE_FIREBASE_PROD=false
REACT_APP_DEBUG_MODE=true
```

#### Production Setup:
```env
REACT_APP_USE_FIREBASE_PROD=true
REACT_APP_DEBUG_MODE=false
```

### Security Notes

- ⚠️ **Never commit `.env` file to version control**
- Add `.env` to your `.gitignore` file
- Use environment-specific configuration for different deployments
- Regularly rotate API keys for production applications

### Testing Configuration

Use the Firebase Test Component to verify your setup:
1. Import `FirebaseTestComponent` 
2. Run comprehensive tests
3. Check console logs for detailed feedback
4. Verify all storage operations work correctly
