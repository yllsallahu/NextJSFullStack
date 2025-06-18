import { getCsrfToken, signIn, useSession, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import Link from 'next/link';
import { publicRuntimeConfig } from "../../src/lib/config";

export default function SignIn({ csrfToken }: { csrfToken: string | null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Check for error parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    
    if (errorParam === 'OAuthAccountNotLinked') {
      setError("Kjo adresë e-mail tashmë është përdorur me një metodë tjetër autentifikimi. Ju lutemi përdorni metodën tjetër ose një adresë tjetër e-mail.");
      console.log("OAuth account not linked error detected");
    } else if (errorParam === 'AccessDenied') {
      setError("Nuk keni të drejta për të aksesuar këtë faqe.");
    } else if (errorParam === 'Verification') {
      setError("Lidhja për verifikim ka skaduar ose është e pavlefshme.");  
    } else if (errorParam) {
      setError(`Ndodhi një gabim gjatë autentifikimit: ${errorParam}`);
    }
    
    // Log the complete query string for debugging
    console.log("URL search params:", window.location.search);
  }, []);

  useEffect(() => {
    // More detailed debugging to track session state changes
    console.log("Session status:", { 
      authenticated: !!session, 
      user: session?.user?.email,
      provider: session?.user?.provider,
      sessionDetails: session
    });
    
    if (session) {
      // User is authenticated, redirect to homepage immediately
      console.log("User authenticated, redirecting to homepage");
      
      // Use window.location for a hard redirect to ensure browser refresh
      window.location.href = "/";
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Ndodhi një gabim gjatë kyçjes");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    // Clear any previous errors
    setError("");
    
    // Use window.location for a hard redirect after Google auth
    const callbackUrl = `/`;
    
    // Add debug info to console
    console.log(`Initiating Google sign-in with callback URL: ${callbackUrl}`);
    
    // Use signIn with direct redirect settings for a more reliable auth flow
    signIn("google", { 
      callbackUrl,
      redirect: true
    }).catch(err => {
      console.error("Google sign-in error:", err);
      setError("Ndodhi një gabim gjatë kyçjes me Google. Ju lutemi provoni përsëri.");
      setIsLoading(false);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">Kyçu në Blog</h2>
          <p className="mt-2 text-black">
            Mirë se vini përsëri!
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {csrfToken && <input name="csrfToken" type="hidden" defaultValue={csrfToken} />}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black">
              Fjalëkalimi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            }`}
          >
            {isLoading ? "Duke u kyçur..." : "Kyçu"}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ose vazhdo me</span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 ${
                isLoading
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              }`}
              aria-label="Sign in with Google"
              data-testid="google-signin-button"
            >
              {!isLoading && (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
              )}
              {isLoading ? "Duke u kyçur..." : "Vazhdo me Google"}
            </button>
            
            <div className="mt-2 text-xs text-center text-gray-500">
              Klikoni butonin për të u kyçur me llogarinë tuaj Google
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            Nuk keni llogari?{" "}
            <Link href="/sign-up" className="font-medium text-green-600 hover:text-green-500">
              Regjistrohu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Check if user is already authenticated
  const session = await getSession(context);
  
  // Log session state for debugging
  console.log('Server-side session check:', { 
    hasSession: !!session,
    sessionDetails: session ? { 
      user: session.user?.email,
      provider: session.user?.provider
    } : null
  });
  
  // If there's an active session, redirect to the homepage
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    };
  }
  
  const csrfToken = await getCsrfToken(context);
  return {
    props: {
      csrfToken: csrfToken ?? null,
    },
  };
}