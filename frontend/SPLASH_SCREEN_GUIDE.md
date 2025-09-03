# 🎨 PetHub Splash Screen Customization Guide

## Overview
The splash screen is the loading screen that appears when your app starts. It's completely customizable and can be modified in several ways.

---

## 🔧 **Current Configuration**

### **Basic Splash Screen (app.json)**
```json
{
  "expo": {
    "name": "PetHub",
    "slug": "pethub",
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#F5F5F5"
        }
      ]
    ]
  }
}
```

### **Custom Splash Screen Component**
- **File**: `components/CustomSplashScreen.tsx`
- **Features**: Animated logo, loading indicator, version info
- **Duration**: 3 seconds with fade-in animation

---

## 🎯 **Customization Options**

### **1. Basic Splash Screen (app.json)**

#### **Change Splash Image:**
```json
{
  "expo-splash-screen": {
    "image": "./assets/images/your-custom-image.png",
    "imageWidth": 200,
    "resizeMode": "contain",
    "backgroundColor": "#F5F5F5"
  }
}
```

#### **Available resizeMode Options:**
- `"contain"` - Fit entire image within bounds
- `"cover"` - Fill entire area, may crop
- `"stretch"` - Stretch to fill
- `"center"` - Center image without scaling

#### **Background Colors:**
```json
{
  "backgroundColor": "#F5F5F5"  // Light gray
  "backgroundColor": "#0E0F0F"  // Dark gray
  "backgroundColor": "#FFFFFF"  // White
  "backgroundColor": "#000000"  // Black
}
```

### **2. Advanced Custom Splash Screen**

#### **Use Custom Component:**
```tsx
import CustomSplashScreen from '../components/CustomSplashScreen';

// In your app
<CustomSplashScreen 
  onAnimationComplete={() => {
    // Navigate to main app
  }}
/>
```

#### **Customize Animation Duration:**
```tsx
// In CustomSplashScreen.tsx, line 47
const timer = setTimeout(() => {
  if (onAnimationComplete) {
    onAnimationComplete();
  }
}, 3000); // Change this value (in milliseconds)
```

#### **Modify Animation Effects:**
```tsx
// Fade animation duration
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 1000, // Change this value
  useNativeDriver: true,
}),

// Scale animation duration
Animated.timing(scaleAnim, {
  toValue: 1,
  duration: 1000, // Change this value
  useNativeDriver: true,
}),
```

---

## 🖼️ **Image Requirements**

### **Splash Screen Image:**
- **Format**: PNG or JPG
- **Size**: 200x200px (recommended)
- **Background**: Transparent or solid color
- **Location**: `assets/images/`

### **App Icon:**
- **Format**: PNG
- **Size**: 1024x1024px
- **Background**: Required (no transparency)
- **Location**: `assets/images/icon.png`

### **Adaptive Icon (Android):**
- **Format**: PNG
- **Size**: 1024x1024px
- **Background**: Required
- **Location**: `assets/images/adaptive-icon.png`

---

## 🎨 **Design Tips**

### **Professional Splash Screen:**
1. **Use your app logo** as the main image
2. **Keep it simple** - avoid too much text
3. **Match your brand colors** in the background
4. **Ensure good contrast** for readability
5. **Test on different screen sizes**

### **Animation Best Practices:**
1. **Keep animations smooth** (60fps)
2. **Don't make them too long** (2-3 seconds max)
3. **Use subtle effects** - avoid jarring movements
4. **Provide visual feedback** (loading indicators)

---

## 🔄 **Implementation Steps**

### **Option 1: Quick Change (app.json only)**
1. Replace the image in `assets/images/`
2. Update `app.json` configuration
3. Restart the development server

### **Option 2: Custom Component**
1. Modify `components/CustomSplashScreen.tsx`
2. Update colors, text, or animations
3. Test the changes

### **Option 3: Complete Customization**
1. Create your own splash screen component
2. Add it to your app's entry point
3. Handle navigation after splash screen

---

## 📱 **Testing Your Changes**

### **Development:**
```bash
npx expo start --clear
```

### **Production Build:**
```bash
npx expo build:android
npx expo build:ios
```

---

## 🎯 **Current PetHub Splash Screen Features**

### **What You'll See:**
- ✅ **PetHub Logo** (animated fade-in)
- ✅ **App Name**: "PetHub"
- ✅ **Tagline**: "Your Pet's Best Friend"
- ✅ **Loading Indicator**: Rotating paw icon
- ✅ **Version Info**: "Version 1.0.0"
- ✅ **Copyright**: "© 2024 PetHub Capstone"

### **Animation Sequence:**
1. **Fade In** (1 second)
2. **Scale Up** (1 second)
3. **Loading Spinner** (continuous rotation)
4. **Auto-hide** (after 3 seconds)

---

## 🛠️ **Troubleshooting**

### **Splash Screen Not Updating:**
1. Clear cache: `npx expo start --clear`
2. Check image path in `app.json`
3. Verify image format and size

### **Animation Issues:**
1. Check for syntax errors in component
2. Verify all imports are correct
3. Test on different devices

### **Performance Issues:**
1. Optimize image sizes
2. Use `useNativeDriver: true` for animations
3. Avoid complex animations on low-end devices

---

## 📋 **Quick Reference**

### **File Locations:**
- **Configuration**: `app.json`
- **Custom Component**: `components/CustomSplashScreen.tsx`
- **Images**: `assets/images/`
- **Documentation**: `SPLASH_SCREEN_GUIDE.md`

### **Key Properties:**
- **image**: Splash screen image path
- **imageWidth**: Image width in pixels
- **resizeMode**: How image scales
- **backgroundColor**: Background color
- **duration**: Animation duration (custom component)

### **Common Colors:**
- **Primary**: `#0E0F0F` (Dark Gray)
- **Background**: `#F5F5F5` (Light Gray)
- **Accent**: `#666666` (Medium Gray)
- **Text**: `#000000` (Black)

---

The splash screen is now fully customized for PetHub with professional branding and smooth animations! 🚀
