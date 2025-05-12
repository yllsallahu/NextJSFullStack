import { BlogProvider } from "lib/contexts/BlogContext";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "../styles/globals.css";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <BlogProvider>
        <Component {...pageProps} />
      </BlogProvider>
    </SessionProvider>
  );
}

export default MyApp;
