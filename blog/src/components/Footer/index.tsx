import React from 'react'

function Footer() {
  return (
    <footer className="bg-white shadow-md mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">© 2025 Blog. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-green-600">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-green-600">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-green-600">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
