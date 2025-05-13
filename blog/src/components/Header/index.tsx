import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FaSearch, FaBars, FaHome } from 'react-icons/fa';

export default function Header() {
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="bg-gray-50 text-gray-900 body-font shadow w-full">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        {/* Logo */}
        <Link href="/" className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
          <FaHome className="w-10 h-10 text-green-600" />
          <span className="ml-3 text-xl">Blog</span>
        </Link>

        {/* Navigation Links */}
        <nav className={`md:ml-auto md:mr-auto flex items-center text-base justify-center ${isNavExpanded ? 'block' : 'hidden'} md:flex`}>
          <Link href="/" className="mr-5 hover:text-green-600">Kryefaqja</Link>
          <Link href="/blogs" className="mr-5 hover:text-green-600">Bloget</Link>
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="relative mr-4 hidden md:block">
          <input
            type="search"
            name="search"
            placeholder="Search"
            className="bg-white text-gray-900 h-10 px-5 pr-10 rounded-full text-sm focus:outline-none"
          />
          <button type="submit" className="absolute right-0 top-0 mt-3 mr-4">
            <FaSearch />
          </button>
        </div>

        {/* Auth Actions (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {session ? (
            <>
              <span className="text-gray-700">Përshëndetje, {session.user?.name || 'User'}!</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Dil
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="mr-5 hover:text-green-600">Kyçu</Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Regjistrohu
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="text-gray-900 inline-flex items-center ml-auto md:hidden"
          onClick={() => setIsNavExpanded(!isNavExpanded)}
        >
          <FaBars />
        </button>
      </div>

      {/* Mobile Navigation & Search */}
      {isNavExpanded && (
        <div className="px-4 pt-4 pb-4 md:hidden">
          <nav className="flex flex-col space-y-3">
            <Link href="/" className="hover:text-green-600">Kryefaqja</Link>
            <Link href="/blogs" className="hover:text-green-600">Bloget</Link>
            {session ? (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Dil
              </button>
            ) : (
              <>
                <Link href="/auth/signin" className="hover:text-green-600">Kyçu</Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Regjistrohu
                </Link>
              </>
            )}
            <div className="relative mt-2">
              <input
                type="search"
                name="search"
                placeholder="Search"
                className="bg-white text-gray-900 h-10 px-5 pr-10 rounded-full text-sm focus:outline-none w-full"
              />
              <button type="submit" className="absolute right-0 top-0 mt-3 mr-4">
                <FaSearch />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
