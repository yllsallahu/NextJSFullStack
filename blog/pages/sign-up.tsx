// pages/sign-up.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";

export default function SignUp() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user.name || !user.email || !user.password || !user.confirmPassword) {
      setError("Ju lutem plotësoni të gjitha fushat");
      return;
    }

    if (user.password !== user.confirmPassword) {
      setError("Fjalëkalimet nuk përputhen");
      return;
    }

    setIsLoading(true);
    try {
      // First register the user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password: user.password
        })
      });

      const data = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(data.error || "Gabim gjatë regjistrimit");
      }

      // Then automatically sign in
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: user.email,
        password: user.password
      });

      if (signInRes?.error) {
        throw new Error(signInRes.error);
      }

      // Redirect to home page after successful registration and login
      router.push("/");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ndodhi një gabim");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center mb-8">Regjistrohu</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="sr-only">
              Emri
            </label>
            <input
              id="name"
              type="text"
              required
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Emri"
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Email"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Fjalëkalimi
            </label>
            <input
              id="password"
              type="password"
              required
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Fjalëkalimi"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Konfirmo Fjalëkalimin
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={user.confirmPassword}
              onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Konfirmo Fjalëkalimin"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              }`}
            >
              {isLoading ? "Duke u regjistruar..." : "Regjistrohu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
