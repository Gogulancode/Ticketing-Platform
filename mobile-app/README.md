# Nivo Support Mobile App

A React Native mobile application for the Nivo Support ticketing platform, built with Expo.

##  Features

-  Cross-platform support (iOS & Android)
-  Secure authentication with token storage
-  Push notifications for ticket updates
-  Full ticket management (create, view, comment)
-  Dashboard with real-time statistics
-  Settings with notification preferences
-  Google Stitch design implementation

##  Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android builds) or Xcode (for iOS builds)

##  Installation

1. Install dependencies:
```bash
npm install
```

2. Update configuration:
   - Edit `src/config/environment.ts` to set your production API URL
   - Update `app.json` with your Expo project ID
   - Update `src/services/notifications.ts` with your project ID

##  Development

### Run on Expo Go (Development)

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

Scan the QR code with Expo Go app on your device.

##  Building Production APK/IPA

### 1. Login to EAS

```bash
eas login
```

### 2. Configure Project

```bash
# Initialize EAS if not already done
eas build:configure
```

### 3. Build for Android (APK)

```bash
# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### 4. Build for iOS (IPA)

```bash
# Preview build
eas build --platform ios --profile preview

# Production build (requires Apple Developer account)
eas build --platform ios --profile production
```

### 5. Download Builds

After the build completes, download from:
- EAS dashboard: https://expo.dev/accounts/[your-account]/projects/nivo-support/builds
- Or use: `eas build:list`

##  Push Notifications Setup

### Backend Configuration

Add this endpoint to your .NET backend:

```csharp
[HttpPost("register-token")]
public async Task<IActionResult> RegisterPushToken([FromBody] PushTokenRequest request)
{
    // Save push token to database
    // Link to user account
    return Ok();
}
```

### Send Notifications

Use Expo's Push API to send notifications:

```csharp
var message = new
{
    to = "ExponentPushToken[xxxxxx]",
    sound = "default",
    title = "New Comment",
    body = "John Doe commented on your ticket",
    data = new { ticketId = 123 }
};

await httpClient.PostAsJsonAsync(
    "https://exp.host/--/api/v2/push/send",
    message
);
```

##  Environment Configuration

Three environments are supported:

### Development
- Android Emulator: `http://10.0.2.2:5016`
- iOS Simulator: `http://localhost:5016`

### Staging
- URL: `https://staging-api.babajishivram.com`
- Set environment: Edit `app.json`  `extra.environment: "staging"`

### Production
- URL: `https://api.babajishivram.com`
- Set environment: Edit `app.json`  `extra.environment: "production"`

##  Project Structure

```
mobile-app/
 App.tsx                 # Main app component
 app.json               # Expo configuration
 eas.json               # EAS Build configuration
 src/
    config/
       environment.ts # Environment config
    screens/           # All screen components
       LoginScreen.tsx
       HomeScreen.tsx
       TicketsScreen.tsx
       TicketDetailScreen.tsx
       CreateTicketScreen.tsx
       SettingsScreen.tsx
       NotificationsScreen.tsx
       SplashScreen.tsx
    services/          # API and notification services
       api.ts
       notifications.ts
    store/             # Zustand state management
       authStore.ts
       settingsStore.ts
    constants/
        theme.ts       # Design system constants
```

##  API Configuration

Update production URLs in `src/config/environment.ts`:

```typescript
production: {
  apiUrl: 'https://api.babajishivram.com',
  environment: 'production',
}
```

##  App Store Submission

### Android (Google Play)

1. Generate keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `eas.json` with keystore path

3. Build and submit:
```bash
eas submit --platform android
```

### iOS (App Store)

1. Ensure you have:
   - Apple Developer account
   - App Store Connect app created
   - Distribution certificate

2. Build and submit:
```bash
eas submit --platform ios
```

##  Testing

### Test on Physical Device

1. Install Expo Go app
2. Run `npm start`
3. Scan QR code

### Test Production Build

1. Build APK: `eas build -p android --profile preview`
2. Download and install on device
3. Test all features

##  Troubleshooting

### Android Emulator Connection Issues
- Use `http://10.0.2.2:5016` instead of `localhost`
- Ensure backend is running and accessible

### Push Notifications Not Working
- Check permissions in device settings
- Verify Expo project ID in `app.json`
- Ensure backend endpoint `/api/notifications/register-token` exists

### Build Failures
- Clear cache: `npm start -- --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo SDK: `npx expo install --fix`

##  License

Proprietary - Solutions Next Wave LLP

##  Support

For issues or questions, contact: gogulan@Solutionsnext.in
