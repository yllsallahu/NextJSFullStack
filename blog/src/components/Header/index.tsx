import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

// Optimized icon components to prevent re-renders
const FavoriteIcon = React.memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4 mr-1"
  >
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
      clipRule="evenodd"
    />
  </svg>
));

const CollectionsIcon = React.memo(() => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="w-4 h-4 mr-1"
  >
    <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
  </svg>
));

const DashboardIcon = React.memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4 mr-1"
  >
    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
  </svg>
));

// Memoized navigation link component for better performance
const NavLink = React.memo(({ 
  href, 
  children, 
  isActive, 
  className = '',
  onClick,
  prefetch = true
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
}) => (
  <Link
    href={href}
    prefetch={prefetch}
    className={`px-3 py-2 rounded-md transition-colors duration-200 ${
      isActive
        ? 'text-green-600'
        : 'text-gray-600 hover:text-green-600'
    } ${className}`}
    onClick={onClick}
  >
    {children}
  </Link>
));

NavLink.displayName = 'NavLink';

const Header = React.memo(() => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Memoize session-related computations to prevent re-renders
  const isAuthenticated = useMemo(() => status === 'authenticated' && session, [status, session]);
  const isLoading = useMemo(() => status === 'loading', [status]);
  const isSuperUser = useMemo(() => isAuthenticated && session?.user?.isSuperUser, [isAuthenticated, session?.user?.isSuperUser]);

  // Memoize active states to prevent unnecessary re-computations
  const activeStates = useMemo(() => ({
    home: router.pathname === '/',
    blogs: router.pathname.startsWith('/blogs'),
    favorites: router.pathname === '/favorites',
    collections: router.pathname === '/collections' || router.pathname.startsWith('/collections/'),
    contact: router.pathname === '/contact',
    dashboard: router.pathname === '/dashboard',
    adminUsers: router.pathname === '/admin/users',
    profile: router.pathname === '/profile'
  }), [router.pathname]);

  // Optimized callbacks
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    closeMenu();
    await signOut({ callbackUrl: '/' });
  }, [closeMenu]);

  // Don't render authenticated links during loading to prevent flash
  if (isLoading) {
    return (
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-green-600">
              Blog
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <NavLink href="/" isActive={activeStates.home}>Home</NavLink>
              <NavLink href="/blogs" isActive={activeStates.blogs}>Blogs</NavLink>
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-green-600">
            Blog
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/" isActive={activeStates.home}>
              Home
            </NavLink>
            <NavLink href="/blogs" isActive={activeStates.blogs}>
              Blogs
            </NavLink>
            
            {/* Always show these links if authenticated, regardless of environment */}
            {isAuthenticated && (
              <>
                <NavLink href="/favorites" isActive={activeStates.favorites} className="flex items-center" prefetch={true}>
                  <FavoriteIcon />
                  Favorites
                </NavLink>
                
                <NavLink href="/collections" isActive={activeStates.collections} className="flex items-center" prefetch={true}>
                  <CollectionsIcon />
                  Collections
                </NavLink>
                
                <NavLink href="/contact" isActive={activeStates.contact} className="flex items-center" prefetch={true}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.142.638 4.125 1.734 5.751a20.77 20.77 0 01-.87 2.693.75.75 0 00.92.992 25.354 25.354 0 01.87-.693zM7.5 15.75c0 .414-.168.75-.375.75S6.75 16.164 6.75 15.75s.168-.75.375-.75.375.336.375.75zm-.375-9.75c.414 0 .75.336.75.75s-.336.75-.75.75h-1.5a.75.75 0 010-1.5h1.5zm6 0c.414 0 .75.336.75.75s-.336.75-.75.75h-3a.75.75 0 010-1.5h3zm-3 3.75a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-3.75a.75.75 0 00-.75-.75z" clipRule="evenodd" />
                  </svg>
                  Contact
                </NavLink>
                
                <NavLink href="/dashboard" isActive={activeStates.dashboard} className="flex items-center" prefetch={true}>
                  <DashboardIcon />
                  Dashboard
                </NavLink>
              </>
            )}
            
            {isSuperUser && (
              <NavLink href="/admin/users" isActive={activeStates.adminUsers}>
                Users
              </NavLink>
            )}

            {isAuthenticated ? (
              <div className="relative ml-3">
                <button
                  onClick={toggleMenu}
                  className="flex items-center text-gray-600 hover:text-green-600 transition-colors duration-200"
                >
                  <span className="mr-2">{session?.user?.name}</span>
                  <svg
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-xl z-50 border">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                      onClick={closeMenu}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                      onClick={closeMenu}
                    >
                      <FavoriteIcon />
                      Favorites
                    </Link>
                    {isSuperUser && (
                      <>
                        <Link
                          href="/blogs/create"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                          onClick={closeMenu}
                        >
                          Create Blog
                        </Link>
                        <Link
                          href="/admin/users"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                          onClick={closeMenu}
                        >
                          Manage Users
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-green-600 px-3 py-2 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md transition-colors duration-200 ${
                  activeStates.home
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link
                href="/blogs"
                className={`block px-3 py-2 rounded-md transition-colors duration-200 ${
                  activeStates.blogs
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
                onClick={closeMenu}
              >
                Blogs
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    href="/favorites"
                    className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
                      activeStates.favorites
                        ? 'text-green-600'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                    onClick={closeMenu}
                  >
                    <FavoriteIcon />
                    Favorites
                  </Link>
                  
                  <Link
                    href="/dashboard"
                    className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
                      activeStates.dashboard
                        ? 'text-green-600'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                    onClick={closeMenu}
                  >
                    <DashboardIcon />
                    Dashboard
                  </Link>
                </>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    My Profile
                  </Link>
                  {isSuperUser && (
                    <Link
                      href="/blogs/create"
                      className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors duration-200"
                      onClick={closeMenu}
                    >
                      Create Blog
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="block px-3 py-2 text-gray-600 hover:text-green-600 transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block px-3 py-2 text-green-600 hover:text-green-700 transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
