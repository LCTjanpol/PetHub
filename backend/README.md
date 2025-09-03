# PetHub Backend API

The backend API for PetHub, built with Next.js, TypeScript, and Prisma ORM.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/pethub"
   JWT_SECRET="your-secret-key-here"
   NEXTAUTH_SECRET="your-nextauth-secret"
   ```

3. **Database setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── pages/api/           # API route handlers
│   ├── admin/           # Admin endpoints
│   ├── auth/            # Authentication
│   ├── pet/             # Pet management
│   ├── post/            # Social posts
│   ├── shop/            # Shop management
│   └── user/            # User profiles
├── lib/                 # Utilities and middleware
├── prisma/              # Database schema
├── public/              # Static files
└── types/               # TypeScript types
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/register-simple` - Simple registration

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/shop-status` - Check shop owner status

### Pet Management
- `GET /api/pet` - List pets
- `POST /api/pet` - Create pet
- `GET /api/pet/[id]` - Get pet details
- `PUT /api/pet/[id]` - Update pet
- `DELETE /api/pet/[id]` - Delete pet

### Social Posts
- `GET /api/post` - List posts
- `POST /api/post` - Create post
- `PUT /api/post/[id]` - Update post
- `DELETE /api/post/[id]` - Delete post
- `POST /api/post/[id]/like` - Like/unlike post
- `POST /api/posts/[id]/comments` - Add comment
- `POST /api/posts/[id]/comments/[commentId]/replies` - Add reply

### Shop Management
- `POST /api/shop/apply` - Apply for shop ownership
- `GET /api/shop/profile` - Get shop profile
- `PUT /api/shop/profile` - Update shop profile
- `POST /api/shop/promotional-post` - Create promotional post

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/pets` - List all pets
- `GET /api/admin/shops` - List all shops
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/shop-applications/[id]/[action]` - Approve/reject shop applications

### Health & Testing
- `GET /api/health` - Health check endpoint

## 🗄️ Database Schema

### Core Models

#### User
```typescript
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String
  fullName        String
  profilePicture  String?
  isShopOwner     Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  pets            Pet[]
  posts          Post[]
  shop           Shop?
  // ... other relations
}
```

#### Pet
```typescript
model Pet {
  id              String   @id @default(cuid())
  name            String
  species         String
  breed           String?
  age             Int?
  petPicture      String?
  userId          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  medicalRecords  MedicalRecord[]
  tasks           Task[]
  vaccinations    Vaccination[]
}
```

#### Post
```typescript
model Post {
  id              String   @id @default(cuid())
  content         String
  image           String?
  userId          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  likes           PostLike[]
  comments        Comment[]
}
```

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Login** to get a JWT token
2. **Include token** in Authorization header: `Bearer <token>`
3. **Token validation** via middleware

### Protected Routes
Most API endpoints require authentication. Include the JWT token in the request header:
```
Authorization: Bearer <your-jwt-token>
```

## 📸 File Uploads

### Image Upload Endpoints
- Pet profile pictures
- User profile pictures
- Post images
- Shop images

### File Validation
- File type: Images only (JPEG, PNG, GIF)
- File size: Maximum 15MB
- Automatic resizing and optimization

## 🚀 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
npx prisma migrate dev # Run migrations
npx prisma generate  # Generate Prisma client
```

## 🧪 Testing

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Railway
1. Connect repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance

- **API Response Time**: < 200ms average
- **Database Queries**: Optimized with Prisma
- **File Uploads**: Streamlined with Multer
- **Caching**: Implemented for static assets

## 🔒 Security Features

- JWT token authentication
- CORS protection
- Input validation and sanitization
- Rate limiting (recommended)
- Secure file uploads
- SQL injection protection via Prisma

## 📞 Support

For backend-specific issues:
- Check the logs in development mode
- Verify database connectivity
- Ensure environment variables are set correctly
- Contact: lonodpaul18@gmail.com

---

**Backend API** - Powering PetHub's mobile experience! 🚀
