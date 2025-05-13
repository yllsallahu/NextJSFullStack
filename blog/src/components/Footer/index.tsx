import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-xl font-bold text-green-600">
              Blog
            </Link>
            <p className="text-gray-600 mt-2">
              © {new Date().getFullYear()} Blog. Të gjitha të drejtat e rezervuara.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-green-600"
            >
              Kryefaqja
            </Link>
            <Link
              href="/blogs"
              className="text-gray-600 hover:text-green-600"
            >
              Bloget
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-green-600"
            >
              Rreth Nesh
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-green-600"
            >
              Kontakti
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
