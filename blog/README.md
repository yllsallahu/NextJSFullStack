# NextJS Full Stack Blog Application

This is a full-stack blog application built with Next.js, MongoDB, and NextAuth.js.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth Configuration (Required for Google Sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Vercel Blob Storage Token
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### 2. Google OAuth Setup

To fix the Google OAuth authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set the application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret to your `.env.local` file

### 3. Running the Application

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

## Features

- User authentication with NextAuth.js (Credentials + Google OAuth)
- Blog creation, editing, and deletion
- Favorite blogs functionality
- User management (admin features)
- Responsive design with Tailwind CSS
- MongoDB integration
- Image upload support

## Troubleshooting

### Google OAuth "client_id is required" Error

This error occurs when `GOOGLE_CLIENT_ID` is missing from your environment variables. Follow the Google OAuth Setup instructions above.

### Infinite Loop in Favorites Page

The favorites page has been fixed to prevent infinite API calls. Make sure you're authenticated to view your favorites.

### Port Configuration Issues

The application is configured to run on port 3000. If you see port conflicts, make sure:
- `NEXTAUTH_URL=http://localhost:3000` in your `.env.local`
- No other applications are running on port 3000
- Use `npm run dev -p 3000` to force port 3000 if needed

## Default Admin User

The first user to register will automatically become a super user with admin privileges.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
