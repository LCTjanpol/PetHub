# 🚀 PetHub Deployment Guide

Complete deployment guide for PetHub using Vercel (backend), Supabase (database), Expo (frontend), and GitHub (repository).

## 📋 **Prerequisites**

- GitHub account with PetHub repository
- Supabase account
- Vercel account
- Expo account
- Node.js 18+ installed locally

---

## 🗄️ **Step 1: Supabase Database Setup**

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `pethub-database`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your target users
4. Click **"Create new project"**

### 1.2 Get Database Connection Details
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (postgresql://...)
3. Save your **Database Password**
4. Note your **Project Reference ID**

### 1.3 Update Environment Variables
1. In your backend directory, create `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   JWT_SECRET="your-super-secure-jwt-secret-key-here"
   NEXTAUTH_SECRET="your-nextauth-secret-key-here"
   NODE_ENV="production"
   ```

---

## ☁️ **Step 2: Vercel Backend Deployment**

### 2.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"New Project"**
3. Import your GitHub repository: `LCTjanpol/PetHub`
4. Select the **backend** folder as the root directory

### 2.2 Configure Vercel Settings
1. **Framework Preset**: Next.js
2. **Root Directory**: `backend`
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`

### 2.3 Set Environment Variables in Vercel
1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   ```
   DATABASE_URL = [Your Supabase connection string]
   JWT_SECRET = [Your JWT secret]
   NEXTAUTH_SECRET = [Your NextAuth secret]
   NODE_ENV = production
   ```

### 2.4 Deploy Backend
1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your **Vercel URL** (e.g., `https://pethub-backend.vercel.app`)

---

## 📱 **Step 3: Expo Frontend Setup**

### 3.1 Update Frontend Environment
1. In your frontend directory, create `.env` file:
   ```env
   EXPO_PUBLIC_API_URL="https://your-vercel-app.vercel.app"
   NODE_ENV="production"
   ```

### 3.2 Install Expo CLI (if not installed)
```bash
npm install -g @expo/cli
```

### 3.3 Build APK for Android
```bash
cd frontend
npx expo build:android --release-channel production
```

### 3.4 Alternative: Build with EAS (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build APK
eas build --platform android --profile production
```

---

## 🔄 **Step 4: Database Migration**

### 4.1 Run Database Migrations
1. **Option A: Via Vercel Functions**
   - Vercel will automatically run `prisma generate` and `prisma db push`
   - Check Vercel build logs for any database errors

2. **Option B: Manual Migration**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

### 4.2 Verify Database Connection
1. Go to Supabase Dashboard
2. Check **Table Editor** to see if tables were created
3. Verify **API** section shows your database structure

---

## 🧪 **Step 5: Testing Deployment**

### 5.1 Test Backend API
```bash
# Test health endpoint
curl https://your-vercel-app.vercel.app/api/health

# Test database connection
curl https://your-vercel-app.vercel.app/api/user/profile
```

### 5.2 Test Frontend
1. Install APK on Android device
2. Test login/registration
3. Test pet management features
4. Test social features
5. Test shop features

---

## 🔧 **Step 6: Production Configuration**

### 6.1 Update CORS Settings
In your backend API routes, ensure CORS is properly configured for production:

```typescript
// Example CORS configuration
const corsOptions = {
  origin: [
    'https://your-expo-app.com',
    'exp://your-expo-url',
    'http://localhost:3000' // for development
  ],
  credentials: true
};
```

### 6.2 Environment Variables Checklist
- ✅ `DATABASE_URL` (Supabase)
- ✅ `JWT_SECRET` (Secure random string)
- ✅ `NEXTAUTH_SECRET` (Secure random string)
- ✅ `NODE_ENV` (production)
- ✅ `EXPO_PUBLIC_API_URL` (Vercel URL)

---

## 📊 **Step 7: Monitoring & Maintenance**

### 7.1 Vercel Monitoring
- **Analytics**: View API usage and performance
- **Functions**: Monitor serverless function execution
- **Logs**: Check for errors and issues

### 7.2 Supabase Monitoring
- **Database**: Monitor query performance
- **API**: Check API usage and limits
- **Logs**: Review database logs

### 7.3 Expo Monitoring
- **Builds**: Monitor build status and history
- **Analytics**: Track app usage and crashes
- **Updates**: Manage app updates and releases

---

## 🚨 **Troubleshooting Common Issues**

### Database Connection Issues
```bash
# Check if DATABASE_URL is correct
# Verify Supabase project is active
# Check if IP restrictions are blocking Vercel
```

### Build Failures
```bash
# Check Vercel build logs
# Verify all environment variables are set
# Check package.json scripts
```

### API Errors
```bash
# Verify CORS configuration
# Check JWT token generation
# Verify database migrations completed
```

---

## 🔗 **Final URLs & Configuration**

### Production URLs
- **Backend API**: `https://your-app.vercel.app`
- **Database**: Supabase Dashboard
- **Frontend**: Expo APK file
- **Repository**: `https://github.com/LCTjanpol/PetHub`

### Environment Files
- **Backend**: `.env` with Supabase and JWT secrets
- **Frontend**: `.env` with Vercel API URL
- **Vercel**: Environment variables in dashboard

---

## ✅ **Deployment Checklist**

- [ ] Supabase project created and configured
- [ ] Database connection string obtained
- [ ] Backend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Database migrations completed
- [ ] Frontend APK built and tested
- [ ] API endpoints tested and working
- [ ] CORS configured for production
- [ ] All features tested on mobile device

---

## 🎉 **Congratulations!**

Your PetHub app is now deployed and ready for production use!

**Next Steps:**
1. Share the APK with users
2. Monitor app performance
3. Set up analytics and crash reporting
4. Plan future updates and features

---

**Need Help?**
- Check Vercel deployment logs
- Review Supabase database status
- Test API endpoints individually
- Contact: lonodpaul18@gmail.com

---

**PetHub** - Now deployed and ready to connect pet owners! 🐾🚀
