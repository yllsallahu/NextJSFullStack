import { BlogProvider } from "lib/contexts/BlogContext";
import { FavoritesProvider } from "lib/contexts/FavoritesContext";
import { SessionProvider } from "next-auth/react";
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
      
      // Add analytics for authentication debugging
      if (session?.user?.email) {
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
      // More aggressive refetch interval during authentication
      refetchInterval={30} // Check every 30 seconds
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <FavoritesProvider initialFavorites={pageProps.initialFavorites || []} initialFavoriteIds={pageProps.initialFavoriteIds || []}>
        <BlogProvider>
          <Component {...pageProps} />
        </BlogProvider>
      </FavoritesProvider>
    </SessionProvider>
  );
}

export default MyApp;
