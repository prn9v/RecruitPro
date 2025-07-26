# RecruitPro Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/recruitpro"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Optional: Cloudinary Configuration

For file uploads (resumes), you can configure Cloudinary:

#### Option 1: Use CLOUDINARY_URL (recommended for production)
```env
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

#### Option 2: Use individual credentials
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Note
- If Cloudinary is not configured, files will be stored locally in the `public/uploads/resumes/` directory during development
- For production, it's recommended to use Cloudinary for better file management and CDN benefits

## Getting Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env.local` file

## Installation

```bash
npm install
npm run dev
```

## Database Setup

```bash
npx prisma generate
npx prisma db push
``` 