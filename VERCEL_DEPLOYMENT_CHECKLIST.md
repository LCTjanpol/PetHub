# 🚀 Vercel Deployment Checklist for PetHub

## ✅ **Environment Variables to Set in Vercel Dashboard**

Copy these exact values to your Vercel project settings:

### **Required Environment Variables:**

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | `postgres://postgres.eoznjmlkdaicimuylhum:ZU7HiFUIBzwYtbHD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true` |
| `JWT_SECRET` | `c2620eb0ce818dc700ea52ae1bf04aa007a6629efe8815ed7a499394053d94aa31a813fa344737a551f2151d0ff8f6ddc92c30a4efaa06ce923968d3ae27e61d` |
| `NEXTAUTH_SECRET` | `269b04a84a5b5b395ce6866d5eaf32925116173320654e7d6d9682dda79d72d101241315c0a69a293cc32bebdab86de07a8975cb822610854f83ae2454d07179` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://eoznjmlkdaicimuylhum.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvem5qbWxrZGFpY2ltdXlsaHVtIiwicwciOiJub24iLCJpYXQiOjE3NTY4OTc0NTcsImV4cCI6MjA3MjQ3MzQ1N30.Ot9bflNtWG46Q1xtnCZMpDlM1_cc3VFv-96FNsYQ71w` |

## 🔧 **Vercel Project Configuration**

### **Build Settings:**
- **Framework Preset**: Next.js
- **Root Directory**: `backend`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **Function Settings:**
- **Max Duration**: 30 seconds (already configured in vercel.json)

## 📋 **Step-by-Step Vercel Setup:**

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import Git Repository**: `LCTjanpol/PetHub`
4. **Configure Project**:
   - Root Directory: `backend`
   - Framework Preset: Next.js
5. **Set Environment Variables** (copy from table above)
6. **Click "Deploy"**

## 🧪 **Test Your Deployment:**

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test database connection
curl https://your-app.vercel.app/api/user/profile
```

## 🔗 **Your Supabase Project Details:**

- **Project Reference**: `eoznjmlkdaicimuylhum`
- **Region**: US East 1 (AWS)
- **Database**: PostgreSQL with connection pooling
- **SSL**: Required and configured

## ⚠️ **Important Notes:**

- ✅ **Connection pooling enabled** (better performance)
- ✅ **SSL mode required** (secure connection)
- ✅ **JWT secrets generated** (cryptographically secure)
- ✅ **Environment variables ready** (copy-paste deployment)

## 🎯 **Next Steps After Vercel Deployment:**

1. **Copy your Vercel URL** (e.g., `https://pethub-backend.vercel.app`)
2. **Update frontend environment** with the Vercel URL
3. **Build your Expo APK**
4. **Test the complete system**

---

**Ready to deploy!** 🚀

Copy the environment variables above and deploy to Vercel!
