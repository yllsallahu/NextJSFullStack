import { signOut } from "next-auth/react";
import Link from 'next/link';

export default function Navbar() {
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
          
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition"
          >
            Dil
          </button>
        </div>
      </div>
    </nav>
  );
}
