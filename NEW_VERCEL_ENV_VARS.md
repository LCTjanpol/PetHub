# New Vercel Project Environment Variables

## Database Configuration
```
DATABASE_URL="postgres://postgres.heonbvabwydcdbulrtqk:6UgdFWv7iONKzaot@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

## JWT Secrets (Freshly Generated)
```
JWT_SECRET="8859571bbacd3be0b7ecf726d4cdf67f436159b03302056ca86414021abf1169"
NEXTAUTH_SECRET="eeb53e3265caa7d3b03cb9cead8a49a3788ea2bb0031dfa0da7571f2379faf25"
```

## Supabase Configuration
```
SUPABASE_URL="https://heonbvabwydcdbulrtqk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb25idmFid3lkY2RidWxydHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MDYxOTIsImV4cCI6MjA3MjQ4MjE5Mn0.K735Y3IZaoK27xPlJ6lTSqKhkCLZlpmPfEGv_bFfOGM"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb25idmFid3lkY2RidWxydHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkwNjE5MiwiZXhwIjoyMDcyNDgyMTkyfQ.htVIm0AoCMG7ob032YOiEfzI_Fv3tzXUq1RslxO9aTs"
SUPABASE_JWT_SECRET="gSVhv2OABeQXASEPgX73De/qrP9iEFB92zGWC4xtWW6U7SrjRlD9/qLBYFxpGFlRWiwfcKnt+1lg+NecMEHyhQ=="
```

## PostgreSQL Details (Reference Only)
```
POSTGRES_URL="postgres://postgres.heonbvabwydcdbulrtqk:6UgdFWv7iONKzaot@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_USER="postgres"
POSTGRES_HOST="db.heonbvabwydcdbulrtqk.supabase.co"
POSTGRES_PASSWORD="6UgdFWv7iONKzaot"
POSTGRES_DATABASE="postgres"
POSTGRES_PRISMA_URL="postgres://postgres.heonbvabwydcdbulrtqk:6UgdFWv7iONKzaot@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.heonbvabwydcdbulrtqk:6UgdFWv7iONKzaot@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## Environment
```
NODE_ENV="production"
```

## Setup Instructions:

### 1. Set Up Supabase Database
1. Go to your new Supabase project: `heonbvabwydcdbulrtqk`
2. Go to **"SQL Editor"**
3. Copy and paste the entire `SUPABASE_SCHEMA_NEW.sql` file
4. Click **"Run"** to create all tables and policies

### 2. Create New Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import from GitHub: `LCTjanpol/PetHub`
4. Choose branch: `master`
5. Set root directory: `backend`
6. Framework: Next.js (auto-detected)

### 3. Add Environment Variables
1. Go to **"Settings" > "Environment Variables"**
2. Add all variables from this file
3. Set all to **"Production"** environment
4. Make sure `DATABASE_URL` is correct for Prisma

### 4. Deploy
1. Click **"Deploy"**
2. Vercel will use latest commit (`56cba49`)
3. TailwindCSS v3 will work (no more PostCSS errors)
4. Your backend will deploy successfully!

## Expected Result:
✅ **Fresh database** with all tables and RLS policies
✅ **New Vercel project** with correct configuration  
✅ **Latest code** with TailwindCSS v3 fix
✅ **Successful deployment** and working API
