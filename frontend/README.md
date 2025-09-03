# PetHub Mobile App

The React Native mobile application for PetHub, built with Expo and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```env
   EXPO_PUBLIC_API_URL="http://localhost:3000"
   ```

3. **Start development server:**
   ```bash
   npx expo start
   ```

4. **Run on device:**
   - Scan QR code with Expo Go app
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 📱 App Features

### Core Functionality
- **User Authentication**: Login/signup with secure token storage
- **Pet Management**: Add, edit, and manage pet profiles
- **Social Feed**: Create posts, comment, and interact
- **Location Services**: Find nearby pet shops and services
- **Shop System**: Shop owner specific features
- **Admin Panel**: Full administrative capabilities

### User Types & Access
- **Regular Users**: Pet management and social features
- **Shop Owners**: Enhanced posting and business management
- **Administrators**: Full system access and moderation

## 📁 Project Structure

```
frontend/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Main tab navigation
│   │   ├── home.tsx       # Social feed
│   │   ├── maps.tsx       # Location services
│   │   ├── pets.tsx       # Pet management
│   │   └── profile.tsx    # User profile
│   ├── (shop-tabs)/       # Shop owner navigation
│   │   ├── home.tsx       # Shop posts
│   │   ├── maps.tsx       # Shop location
│   │   ├── shop.tsx       # Shop management
│   │   └── profile.tsx    # Shop profile
│   ├── admin/             # Admin panel
│   ├── auth/              # Authentication screens
│   ├── editandaddscreens/ # Pet and profile editing
│   ├── shop-profile/      # Shop profile viewing
│   └── shopedit/          # Shop editing
├── components/             # Reusable UI components
├── config/                 # API configuration
├── constants/              # App constants
├── hooks/                  # Custom React hooks
├── services/               # Business logic
├── utils/                  # Utility functions
└── assets/                 # Images, icons, fonts
```

## 🛠️ Tech Stack

### Core Technologies
- **React Native**: Mobile app framework
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based navigation

### UI & Components
- **React Native Core**: Basic components
- **FontAwesome5**: Icon library
- **Custom Components**: Tailored UI elements
- **Responsive Design**: Adaptive layouts

### State Management
- **React Hooks**: useState, useEffect, useCallback
- **AsyncStorage**: Local data persistence
- **Context API**: Global state management

### Navigation
- **Expo Router**: File-based routing
- **Tab Navigation**: Main app structure
- **Stack Navigation**: Screen transitions
- **Modal Navigation**: Overlay screens

## 🔧 Development Commands

```bash
npx expo start          # Start development server
npx expo start --clear  # Clear cache and start
npx expo start --tunnel # Start with tunnel for external access
npx expo build          # Build for production
npx expo publish        # Publish to Expo
npx expo install        # Install Expo-compatible packages
```

## 📱 Screen Navigation

### Main Tab Navigation
1. **Home** - Social feed and post creation
2. **Maps** - Location-based services
3. **Pets** - Pet management
4. **Profile** - User settings

### Shop Owner Navigation
1. **Home** - Shop-specific posts
2. **Maps** - Shop location management
3. **Shop** - Shop profile and settings
4. **Profile** - User and shop management

### Authentication Flow
- Login/Signup screens
- Password recovery
- Account verification

### Admin Panel
- Dashboard overview
- User management
- Pet management
- Shop management
- Application processing

## 🎨 UI Components

### Core Components
- **PostCard**: Social media post display
- **CustomSplashScreen**: App loading screen
- **GlobalNotificationManager**: Notification handling
- **OverlayNotification**: In-app notifications
- **RateReviewModal**: Rating and review system

### Form Components
- **TextInput**: Enhanced input fields
- **ImagePicker**: Photo selection and upload
- **DateTimePicker**: Date and time selection
- **Modal**: Overlay dialogs

### Navigation Components
- **HapticTab**: Tab bar with haptic feedback
- **TabBarBackground**: Custom tab bar styling
- **IconSymbol**: Icon system

## 🔐 Authentication & Security

### Token Management
- JWT token storage in AsyncStorage
- Automatic token refresh
- Secure token handling
- Logout and session cleanup

### User Roles
- **Regular User**: Basic pet management
- **Shop Owner**: Business features
- **Admin**: Full system access

### Data Validation
- Input sanitization
- Form validation
- API error handling
- User permission checks

## 📸 Image Handling

### Image Features
- Profile picture uploads
- Pet photo management
- Post image support
- Shop image handling
- Image optimization
- Fallback images

### Image Picker
- Camera integration
- Gallery selection
- Image editing
- Size validation
- Format support

## 📍 Location Services

### Maps Integration
- Google Maps API
- Location permissions
- Geocoding services
- Distance calculations
- Shop location display

### Location Features
- Find nearby pet shops
- Shop location mapping
- User location tracking
- Address validation

## 🔔 Notifications

### Notification Types
- New pet registrations
- Shop application updates
- Social interactions
- System announcements
- Push notifications

### Notification System
- In-app notifications
- Toast messages
- Alert dialogs
- Badge counts
- Sound alerts

## 📊 State Management

### Local State
- Component-level state
- Form data management
- UI state control
- Loading states

### Global State
- User authentication
- App configuration
- Theme settings
- Language preferences

### Data Persistence
- AsyncStorage for tokens
- Secure storage for sensitive data
- Cache management
- Offline support

## 🧪 Testing

### Development Testing
- Expo development builds
- Device testing
- Emulator testing
- Performance monitoring

### Testing Tools
- Expo DevTools
- React Native Debugger
- Performance profiler
- Error reporting

## 🚀 Building & Deployment

### Development Builds
```bash
npx expo build:android  # Android development build
npx expo build:ios      # iOS development build
```

### Production Builds
```bash
npx expo build:android --release-channel production
npx expo build:ios --release-channel production
```

### App Store Deployment
- **Android**: Google Play Store
- **iOS**: Apple App Store
- **Expo**: Expo Application Services

## 🔧 Configuration

### Environment Variables
- API endpoints
- Feature flags
- Debug settings
- Build configurations

### App Configuration
- App name and version
- Bundle identifiers
- Permissions
- Platform-specific settings

## 📱 Platform Support

### Android
- Minimum SDK: 21
- Target SDK: 33
- Architecture: ARM64, x86_64
- Permissions: Camera, Location, Storage

### iOS
- Minimum version: 12.0
- Target version: 16.0
- Architecture: ARM64
- Permissions: Camera, Location, Photos

## 🎯 Performance

### Optimization
- Image lazy loading
- List virtualization
- Memory management
- Network optimization
- Cache strategies

### Monitoring
- Performance metrics
- Memory usage
- Network requests
- Error tracking
- User analytics

## 🔒 Security

### Data Protection
- Secure storage
- Network security
- Input validation
- Permission handling
- Privacy compliance

### Best Practices
- HTTPS only
- Token expiration
- Secure storage
- Input sanitization
- Error handling

## 📞 Support & Troubleshooting

### Common Issues
- Build failures
- Runtime errors
- Performance problems
- Platform-specific issues

### Debug Tools
- Expo DevTools
- React Native Debugger
- Console logging
- Error boundaries
- Performance profiler

### Getting Help
- Check Expo documentation
- Review React Native guides
- Search GitHub issues
- Contact: lonodpaul18@gmail.com

## 🤝 Contributing

1. Follow the existing code style
2. Test on both platforms
3. Update documentation
4. Submit pull requests
5. Report issues

---

**PetHub Mobile App** - Your pets, your community! 🐾📱
