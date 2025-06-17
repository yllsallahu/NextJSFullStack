import { BlogProvider } from "../src/lib/contexts/BlogContext";
import { FavoritesProvider } from "../src/lib/contexts/FavoritesContext";
import { SessionProvider } from "next-auth/react";
import PerformanceMonitor from "../src/components/shared/PerformanceMonitor";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../styles/globals.css";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Add global authentication tracker
  useEffect(() => {
    // Redirect back to home if we have a nextauth.error in URL (after failed auth)
    if (typeof window !== 'undefined') {
      if (window.location.href.includes('?error=') && 
          window.location.href.includes('signin')) {
        console.error('Auth error detected in URL, redirecting to signin page');
        window.location.href = '/auth/signin';
      }
      
      // Add analytics for authentication debugging (development only)
      if (session?.user?.email && process.env.NODE_ENV === 'development') {
        console.log('User authenticated in _app.tsx:', {
          email: session.user.email,
          provider: session.user.provider || 'unknown'
        });
      }
    }
  }, [session]);

  return (
    <SessionProvider 
      session={session}
      // Optimized for faster navigation - reduced polling
      refetchInterval={0} // Disable automatic refetching
      refetchOnWindowFocus={false} // Disable refetch on window focus
      refetchWhenOffline={false}
      // Ensure session is cached for faster page transitions
      basePath="/api/auth"
    >
      <FavoritesProvider 
        initialFavorites={pageProps.initialFavorites || []} 
        initialFavoriteIds={pageProps.initialFavoriteIds || []}
      >
        <BlogProvider>
          <PerformanceMonitor 
            enabled={process.env.NODE_ENV === 'development'} 
            logToConsole={true}
          />
          <Component {...pageProps} />
        </BlogProvider>
      </FavoritesProvider>
    </SessionProvider>
  );
}

export default MyApp;
