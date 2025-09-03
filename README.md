# PetHub - Pet Management & Social Platform

A comprehensive pet management and social platform built with React Native (frontend) and Next.js (backend), featuring pet profiles, social interactions, shop management, and location-based services.

## 🚀 Features

### Core Features
- **Pet Management**: Add, edit, and manage pet profiles with medical records
- **Social Platform**: Create posts, comment, and interact with other pet owners
- **Shop System**: Pet shop owners can create promotional posts and manage their business
- **Location Services**: Find nearby pet shops and services using maps
- **Admin Panel**: Comprehensive admin dashboard for user and content management
- **Notifications**: Real-time notifications for various activities

### User Types
- **Regular Users**: Pet owners who can manage pets and interact socially
- **Shop Owners**: Business owners with enhanced posting and management capabilities
- **Administrators**: Full system access and moderation capabilities

## 🛠️ Tech Stack

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **UI Components**: Custom components with React Native core components
- **Icons**: FontAwesome5
- **Image Handling**: Expo ImagePicker
- **Storage**: AsyncStorage for local data persistence

### Backend (Next.js)
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **File Upload**: Multer for image handling
- **API Routes**: RESTful API endpoints
- **Middleware**: Custom authentication and CORS handling

### Database
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Migrations**: Automated database schema management

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Type Checking**: TypeScript

## 📁 Project Structure

```
pethub_capstone/
├── frontend/                 # React Native mobile app
│   ├── app/                  # App screens and navigation
│   │   ├── (tabs)/          # Main tab navigation
│   │   ├── (shop-tabs)/     # Shop owner tab navigation
│   │   ├── admin/           # Admin panel screens
│   │   ├── auth/            # Authentication screens
│   │   ├── editandaddscreens/ # Pet and profile editing
│   │   ├── shop-profile/    # Shop profile viewing
│   │   └── shopedit/        # Shop editing functionality
│   ├── components/          # Reusable UI components
│   ├── config/              # API configuration
│   ├── constants/           # App constants and colors
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── assets/              # Images, icons, and fonts
│   └── scripts/             # Development and testing scripts
├── backend/                  # Next.js backend API
│   ├── pages/api/           # API route handlers
│   │   ├── admin/           # Admin API endpoints
│   │   ├── auth/            # Authentication endpoints
│   │   ├── pet/             # Pet management endpoints
│   │   ├── post/            # Social post endpoints
│   │   ├── shop/            # Shop management endpoints
│   │   └── user/            # User profile endpoints
│   ├── lib/                 # Backend utilities
│   ├── prisma/              # Database schema and migrations
│   ├── public/              # Static files and uploads
│   └── types/               # TypeScript type definitions
└── README.md                # This file
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Expo CLI** (for mobile development)
- **Android Studio** or **Xcode** (for mobile testing)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```env
     DATABASE_URL="postgresql://username:password@localhost:5432/pethub"
     JWT_SECRET="your-secret-key"
     NEXTAUTH_SECRET="your-nextauth-secret"
     ```

4. **Database Setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update the API URL:
     ```env
     EXPO_PUBLIC_API_URL="http://localhost:3000"
     ```

4. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator:**
   - Scan QR code with Expo Go app (Android/iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 🔧 Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # Open database GUI
npx prisma migrate dev # Run database migrations
```

### Frontend
```bash
cd frontend
npx expo start       # Start Expo development server
npx expo build       # Build for production
npx expo publish     # Publish to Expo
```

## 📱 App Navigation Structure

### User Tabs
- **Home**: Social feed and post creation
- **Maps**: Location-based pet services
- **Pets**: Pet management and profiles
- **Profile**: User profile and settings

### Shop Owner Tabs
- **Home**: Shop-specific post creation
- **Maps**: Shop location management
- **Shop**: Shop profile and settings
- **Profile**: User and shop profile management

### Admin Panel
- **Dashboard**: System overview and statistics
- **Users**: User management and moderation
- **Pets**: Pet profile management
- **Shops**: Shop approval and management
- **Applications**: Shop application processing

## 🗄️ Database Schema

The application uses the following main entities:
- **User**: User accounts and profiles
- **Pet**: Pet profiles and information
- **Post**: Social media posts and content
- **Shop**: Pet shop information and profiles
- **MedicalRecord**: Pet health and medical history
- **Task**: Pet care tasks and reminders
- **Vaccination**: Pet vaccination records

## 🔐 Authentication & Security

- **JWT-based authentication** for secure API access
- **Role-based access control** (User, Shop Owner, Admin)
- **Secure file uploads** with validation
- **CORS protection** for cross-origin requests
- **Input validation** and sanitization

## 📸 Image Handling

- **Profile pictures** for users and pets
- **Post images** for social content
- **Shop images** for business profiles
- **Automatic image optimization** and resizing
- **Secure file storage** with proper validation

## 🚀 Deployment

### Backend Deployment
- **Vercel**: Recommended for Next.js applications
- **Railway**: Alternative with PostgreSQL support
- **Heroku**: Traditional hosting option

### Frontend Deployment
- **Expo Application Services (EAS)**: Official Expo deployment
- **App Store/Google Play**: Native app distribution
- **Expo Go**: Development and testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of a capstone project and is not licensed for commercial use.

## 👥 Team

- **Developer**: LCTjanpol
- **Project**: PetHub Capstone
- **Institution**: [Your Institution Name]

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: lonodpaul18@gmail.com

---

**PetHub** - Connecting pet owners, one paw at a time! 🐾
