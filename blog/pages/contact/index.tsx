import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError('Gabim gjatë dërgimit të formës. Ju lutemi provoni përsëri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Kontakti - Blog</title>
        <meta name="description" content="Na kontaktoni për çdo pyetje ose sugjerim." />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {/* Hero Section */}
          <div className="bg-green-600 text-white py-16">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Na Kontaktoni</h1>
              <p className="text-xl mb-8">Kemi dëshirë të dëgjojmë nga ju. Dërgoni një mesazh dhe ne do t'ju kontaktojmë së shpejti.</p>
            </div>
          </div>
          {/* Contact Form Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
              {submitted ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h2 className="text-2xl font-bold text-black mb-4">Faleminderit për mesazhin tuaj!</h2>
                  <p className="text-black mb-8">Do t'ju kontaktojmë së shpejti.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Dërgo një mesazh tjetër
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-black">Dërgo mesazh</h2>
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                      <p>{error}</p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-black mb-1">Emri</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-black mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-black mb-1">Mesazhi</label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Duke dërguar...' : 'Dërgo'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
