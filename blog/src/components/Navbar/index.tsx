import { signOut, useSession } from "next-auth/react";
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <ul className="flex space-x-8 items-center">
            <li>
              <Link href="/" className="text-gray-700 hover:text-green-600 transition">
                Home
              </Link>
            </li>
            <li>
              <Link href="/blogs" className="text-gray-700 hover:text-green-600 transition">
                Blogs
              </Link>
            </li>
            {session && (
              <li>
                <Link href="/favorites" className="text-gray-700 hover:text-green-600 transition flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-4 h-4 mr-1"
                  >
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                  Favorites
                </Link>
              </li>
            )}
            <li>
              <Link href="/about" className="text-gray-700 hover:text-green-600 transition">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-700 hover:text-green-600 transition">
                Contact Us
              </Link>
            </li>
          </ul>
          
          {session ? (
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-700 hover:text-green-600 transition">
                Profile
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link 
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
