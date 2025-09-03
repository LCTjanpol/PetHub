# 🚀 PetHub Supabase Database Setup Guide

## ✅ **Fixed the UUID Casting Error!**

The error `cannot cast type uuid to integer` occurred because Supabase uses UUID for `auth.uid()` but our original schema used INTEGER IDs. I've created a corrected schema that uses UUIDs throughout.

## 📋 **Step-by-Step Setup Instructions**

### **Step 1: Access Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### **Step 2: Execute the Fixed Schema**
1. Copy the entire content of `SUPABASE_SCHEMA_FIXED.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute

### **Step 3: Verify the Setup**
After execution, you should see:
- ✅ Success messages in the output
- 📊 13 tables created in the Table Editor
- 📁 4 storage buckets in Storage section
- 🔒 RLS enabled on all tables

## 🔧 **What Was Fixed**

### **Before (Causing Error):**
```sql
-- INTEGER IDs (caused casting error)
id SERIAL PRIMARY KEY,
"userId" INTEGER NOT NULL REFERENCES "User"(id)

-- RLS policies with casting
CREATE POLICY "Users can view their own pets" ON "Pet"
    FOR SELECT USING ("userId" = auth.uid()::integer);  -- ❌ ERROR
```

### **After (Fixed):**
```sql
-- UUID IDs (Supabase standard)
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
"userId" UUID NOT NULL REFERENCES "User"(id)

-- RLS policies without casting
CREATE POLICY "Users can view their own pets" ON "Pet"
    FOR SELECT USING ("userId" = auth.uid());  -- ✅ WORKS
```

## 🗄️ **Database Structure Created**

### **Core Tables (13 total):**
1. **User** - User accounts and profiles
2. **Pet** - Pet profiles and information
3. **Task** - Pet care tasks and reminders
4. **Post** - Social media posts
5. **Comment** - Comments on posts
6. **Reply** - Replies to comments
7. **PostLike** - Post likes by users
8. **VaccinationRecord** - Pet vaccination records
9. **MedicalRecord** - Pet medical records
10. **Shop** - Pet shop information
11. **ShopApplication** - Shop ownership applications
12. **PromotionalPost** - Shop promotional posts

### **Storage Buckets (4 total):**
- `profile-pictures` - User profile images
- `pet-pictures` - Pet profile images
- `post-images` - Post images
- `shop-images` - Shop images

## 🔒 **Security Features**

### **Row Level Security (RLS):**
- ✅ Enabled on all tables
- ✅ Policies configured for proper access control
- ✅ Users can only access their own data
- ✅ Admins have elevated permissions
- ✅ Public read access for approved content

### **RLS Policies Include:**
- **User Access**: Users can only view/edit their own profiles
- **Pet Access**: Users can only manage their own pets
- **Post Access**: Public viewing, restricted editing
- **Shop Access**: Public viewing of approved shops
- **Admin Access**: Full system access for administrators

## ⚡ **Performance Features**

### **Indexes Created:**
- User email and role indexes
- Pet user and type indexes
- Post user and creation time indexes
- Comment post and user indexes
- Shop location and approval indexes

### **Triggers:**
- Auto-update `updatedAt` timestamps
- Automatic data consistency

## 🚨 **Important Notes**

### **UUID vs Integer:**
- **All IDs are now UUIDs** (Supabase standard)
- **No more casting errors** with `auth.uid()`
- **Better security** and scalability
- **Compatible with Supabase Auth**

### **Storage Structure:**
- Files are organized by user ID in folders
- Public read access for images
- Restricted upload/delete permissions
- Automatic cleanup with user deletion

## 🧪 **Testing the Setup**

### **1. Check Tables:**
```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

### **2. Check RLS:**
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### **3. Check Storage:**
```sql
-- Verify storage buckets
SELECT * FROM storage.buckets;
```

## 🔄 **Next Steps After Database Setup**

1. **Update Backend Environment:**
   - Use the Supabase connection string
   - Update any hardcoded ID types to UUID

2. **Test API Endpoints:**
   - Verify database connections
   - Test CRUD operations
   - Verify RLS policies

3. **Deploy to Vercel:**
   - Use the updated environment variables
   - Test the complete system

## 🆘 **Troubleshooting**

### **Common Issues:**
- **"Table already exists"**: Use `DROP TABLE IF EXISTS` before recreating
- **"Policy already exists"**: Drop existing policies first
- **"Extension not available"**: Contact Supabase support

### **Reset Database (if needed):**
```sql
-- Drop all tables (WARNING: Destructive!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 🎉 **Success Indicators**

When everything is working correctly, you should see:
- ✅ All 13 tables created successfully
- ✅ RLS policies applied without errors
- ✅ Storage buckets configured
- ✅ Indexes and triggers created
- ✅ Success messages in the output

---

**Your PetHub Supabase database is now ready!** 🐾✨

Execute the `SUPABASE_SCHEMA_FIXED.sql` file and you'll have a fully functional, secure database with proper UUID support.
