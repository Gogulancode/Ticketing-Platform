#  Production Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] Update production API URL in `src/config/environment.ts`
- [ ] Set `app.json`  `extra.environment` to `"production"`
- [ ] Add your Expo project ID to `app.json`  `extra.eas.projectId`
- [ ] Update app name and bundle identifiers in `app.json`

### 2. Backend Setup
- [ ] Implement backend notification endpoints (see BACKEND_INTEGRATION.md)
- [ ] Add PushTokens and Notifications tables to database
- [ ] Deploy backend with notification support
- [ ] Test API endpoints with Postman

### 3. Assets
- [ ] Create app icon (1024x1024 PNG)
- [ ] Create splash screen image
- [ ] Create notification icon (Android)
- [ ] Verify all images are in `assets/` folder

## Build Process

### 4. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 5. Initialize EAS Project
```bash
eas init
```

### 6. Configure Build Profiles
- [ ] Review `eas.json` build profiles
- [ ] Set Android package name
- [ ] Set iOS bundle identifier

## Android Build

### 7. Build Android APK
```bash
# Preview build (for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### 8. Test Android Build
- [ ] Download APK from EAS dashboard
- [ ] Install on physical Android device
- [ ] Test all features:
  - [ ] Login/Logout
  - [ ] View tickets
  - [ ] Create ticket
  - [ ] Add comments
  - [ ] Receive push notifications
  - [ ] Settings toggles

### 9. Publish to Google Play
```bash
eas submit --platform android
```

## iOS Build

### 10. Apple Developer Setup
- [ ] Enroll in Apple Developer Program
- [ ] Create App ID in App Store Connect
- [ ] Generate Distribution Certificate
- [ ] Create Provisioning Profile

### 11. Build iOS IPA
```bash
# Preview build
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

### 12. Test iOS Build
- [ ] Download IPA from EAS dashboard
- [ ] Install on physical iOS device (TestFlight)
- [ ] Test all features (same as Android)

### 13. Publish to App Store
```bash
eas submit --platform ios
```

## Post-Deployment

### 14. Monitoring
- [ ] Set up error tracking (Sentry, Bugsnag)
- [ ] Monitor EAS build logs
- [ ] Check backend logs for push notification errors
- [ ] Monitor app store ratings and reviews

### 15. Documentation
- [ ] Update user documentation
- [ ] Create internal troubleshooting guide
- [ ] Document backend notification integration

### 16. Marketing
- [ ] Create app store screenshots
- [ ] Write app description
- [ ] Add support email
- [ ] Add privacy policy link

## Version Updates

### 17. Update Version
Before each new build:
- [ ] Increment version in `app.json`
- [ ] Update changelog
- [ ] Tag release in git

```bash
git tag -a v1.0.1 -m "Version 1.0.1 - Bug fixes"
git push origin v1.0.1
```

## Common Issues

### Build Fails
- Clear cache: `npm start -- --clear`
- Reinstall: `rm -rf node_modules && npm install`
- Update Expo: `npx expo install --fix`

### Push Notifications Not Working
- Verify Expo project ID in `app.json`
- Check backend endpoint exists
- Confirm device permissions granted

### API Connection Issues
- Verify production URL is accessible
- Check CORS configuration on backend
- Ensure HTTPS for production

## Quick Commands

```bash
# Development
npm start

# Preview build (testing)
eas build -p android --profile preview
eas build -p ios --profile preview

# Production build
eas build -p android --profile production
eas build -p ios --profile production

# List builds
eas build:list

# Submit to stores
eas submit -p android
eas submit -p ios
```

## Support Contacts

- Expo Support: https://expo.dev/support
- Google Play Support: https://support.google.com/googleplay/android-developer
- Apple Developer Support: https://developer.apple.com/support/

---

** Ready for Production**: All items checked
** Download**: https://expo.dev/accounts/[your-account]/projects/nivo-support/builds
