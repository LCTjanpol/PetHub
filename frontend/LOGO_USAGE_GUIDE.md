# 🎨 PetHub Logo Usage Guide

## Overview
Your PetHub logo (`logo.png`) is now being used consistently across all parts of the app instead of generic icons or favicons.

---

## 📱 **Where Your Logo is Used**

### **1. Splash Screen (Loading Screen)**
- **File**: `app.json` → `expo-splash-screen` plugin
- **Image**: `./assets/images/logo.png`
- **Size**: 250px width
- **Background**: Light gray (`#F5F5F5`)
- **What you see**: Your PetHub logo appears when the app starts

### **2. App Icon (Home Screen)**
- **File**: `app.json` → `icon`
- **Image**: `./assets/images/logo.png`
- **What you see**: Your logo appears as the app icon on device home screens

### **3. Android Adaptive Icon**
- **File**: `app.json` → `android.adaptiveIcon.foregroundImage`
- **Image**: `./assets/images/logo.png`
- **Background**: Light gray (`#F5F5F5`)
- **What you see**: Your logo on Android devices with adaptive icons

### **4. Web Favicon**
- **File**: `app.json` → `web.favicon`
- **Image**: `./assets/images/logo.png`
- **What you see**: Your logo in browser tabs when using the web version

### **5. Custom Splash Screen Component**
- **File**: `components/CustomSplashScreen.tsx`
- **Image**: `require('../assets/images/logo.png')`
- **Size**: 180x180px
- **What you see**: Animated version of your logo with loading effects

---

## 🎯 **Current Configuration**

### **app.json Configuration:**
```json
{
  "expo": {
    "name": "PetHub",
    "icon": "./assets/images/logo.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/logo.png",
        "backgroundColor": "#F5F5F5"
      }
    },
    "web": {
      "favicon": "./assets/images/logo.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 250,
          "resizeMode": "contain",
          "backgroundColor": "#F5F5F5"
        }
      ]
    ]
  }
}
```

### **Custom Splash Screen:**
```tsx
// In CustomSplashScreen.tsx
<Image
  source={require('../assets/images/logo.png')}
  style={styles.logo}
  resizeMode="contain"
/>

const styles = StyleSheet.create({
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
});
```

---

## 🔄 **What Changed**

### **Before:**
- ❌ Generic favicon in loading screen
- ❌ Default Expo icon as app icon
- ❌ Mixed branding across different parts

### **After:**
- ✅ **PetHub logo** in loading screen
- ✅ **PetHub logo** as app icon
- ✅ **PetHub logo** in browser tabs
- ✅ **PetHub logo** in Android adaptive icons
- ✅ **Consistent branding** throughout the app

---

## 🎨 **Customization Options**

### **Change Logo Size:**
```json
// In app.json - Splash screen size
"imageWidth": 250  // Increase or decrease this value

// In CustomSplashScreen.tsx - Component size
logo: {
  width: 180,   // Change this value
  height: 180,  // Change this value
}
```

### **Change Background Color:**
```json
// In app.json
"backgroundColor": "#F5F5F5"  // Light gray
"backgroundColor": "#0E0F0F"  // Dark gray
"backgroundColor": "#FFFFFF"  // White
```

### **Change Logo File:**
1. Replace `assets/images/logo.png` with your new logo
2. Keep the same filename or update all references in `app.json`
3. Restart the development server

---

## 📱 **Testing Your Logo**

### **To See the Changes:**
1. **Restart the app**: `npx expo start --clear`
2. **Check splash screen**: App startup loading screen
3. **Check app icon**: Device home screen
4. **Check web favicon**: Browser tab (if using web version)

### **What You Should See:**
- ✅ **Loading screen**: Your PetHub logo with light gray background
- ✅ **App icon**: Your PetHub logo on device home screen
- ✅ **Consistent branding**: Same logo everywhere

---

## 🛠️ **Troubleshooting**

### **Logo Not Showing:**
1. **Check file path**: Ensure `logo.png` exists in `assets/images/`
2. **Clear cache**: `npx expo start --clear`
3. **Check file format**: Use PNG format for best results
4. **Verify file size**: Should be under 1MB for optimal performance

### **Logo Too Big/Small:**
1. **Splash screen**: Adjust `imageWidth` in `app.json`
2. **Custom component**: Adjust `width` and `height` in styles
3. **App icon**: The system will automatically resize for different contexts

### **Logo Quality Issues:**
1. **Use high-resolution**: At least 1024x1024px for app icon
2. **Optimize file size**: Compress without losing quality
3. **Test on different devices**: Check how it looks on various screen sizes

---

## 📋 **Quick Reference**

### **Logo File:**
- **Path**: `assets/images/logo.png`
- **Size**: 153KB (current)
- **Format**: PNG (recommended)

### **Configuration Files:**
- **Main config**: `app.json`
- **Custom component**: `components/CustomSplashScreen.tsx`
- **Documentation**: `LOGO_USAGE_GUIDE.md`

### **Key Properties:**
- **Splash screen**: `expo-splash-screen.image`
- **App icon**: `expo.icon`
- **Android icon**: `android.adaptiveIcon.foregroundImage`
- **Web favicon**: `web.favicon`

---

Your PetHub logo is now consistently used throughout the entire app! 🎉
