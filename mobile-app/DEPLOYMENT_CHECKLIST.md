# Mobile App Deployment Checklist

## Pre-Deployment Verification

### 1. Environment Configuration
- [ ] Update API_URL in src/config/environment.ts with production URL
- [ ] Configure push notification credentials (FCM for Android, APNs for iOS)
- [ ] Update app.json with correct bundle identifiers

### 2. Backend Requirements
- [ ] Ensure backend supports mobile API endpoints
- [ ] Verify CORS allows mobile app origins
- [ ] Test authentication endpoints work with mobile
- [ ] Push notification endpoint configured (/api/notifications/register-device)

### 3. Testing Checklist
- [ ] Login/Logout flow works
- [ ] Ticket list loads correctly
- [ ] Create ticket submits successfully
- [ ] Comments load and post correctly
- [ ] Push notifications received
- [ ] Settings persist after app restart

### 4. Build Commands

#### Development
```
npx expo start
```

#### Android APK (Local)
```
npx expo run:android
```

#### iOS Build (Local - Mac required)
```
npx expo run:ios
```

#### Production Builds (EAS)
```
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for stores
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### 5. API Endpoints Required
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | User authentication |
| /api/tickets | GET | List tickets |
| /api/tickets | POST | Create ticket |
| /api/tickets/{id} | GET | Ticket details |
| /api/tickets/{id}/comments | GET | Get comments |
| /api/tickets/{id}/comments | POST | Add comment |
| /api/tickets/categories | GET | List categories |
| /api/notifications/register-device | POST | Register push token |

### 6. Environment URLs
| Environment | API URL |
|-------------|---------|
| Development | http://localhost:5016/api |
| Staging | https://staging-api.yourdomain.com/api |
| Production | https://api.yourdomain.com/api |

## Quick Start Commands

### Start All Services (Development)
```powershell
# Terminal 1: Backend
dotnet run --project backend/ERPTraining.API --urls http://localhost:5016

# Terminal 2: Web Frontend  
npm run dev

# Terminal 3: Mobile App
cd mobile-app && npx expo start
```

---
Generated: 2025-12-17 11:14
