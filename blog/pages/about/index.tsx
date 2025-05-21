import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <>
      <Head>
        <title>Rreth Nesh - Blog</title>
        <meta name="description" content="Mësoni më shumë rreth nesh dhe misionit tonë." />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {/* Hero Section */}
          <div className="bg-green-600 text-white py-16">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Rreth Nesh</h1>
              <p className="text-xl mb-8">Mësoni më shumë për historinë dhe vizionin tonë</p>
            </div>
          </div>
          {/* Main Content Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-black">Kush jemi ne</h2>
              <p className="text-black mb-6">
                Blog është një platformë e krijuar për të ndarë njohuri, ide dhe histori interesante. Ne besojmë në fuqinë e përmbajtjes së shkruar dhe dëshirojmë të krijojmë një hapësirë ku njerëzit mund të zbulojnë dhe kontribuojnë me idetë e tyre.
              </p>
              <h2 className="text-2xl font-bold mb-6 text-black">Misioni ynë</h2>
              <p className="text-black mb-6">
                Qëllimi ynë është të krijojmë një komunitet të përkushtuar blogerësh dhe lexuesish që vlerësojnë mendimin kritik dhe diskutimin konstruktiv. Ne besojmë në fuqinë e fjalës së shkruar dhe mundësinë e saj për të frymëzuar dhe edukuar.
              </p>
              <h2 className="text-2xl font-bold mb-6 text-black">Si funksionon</h2>
              <p className="text-black">
                Përdoruesit mund të lexojnë blogje pa qenë të regjistruar. Për të pëlqyer dhe komentuar, përdoruesit duhet të krijojnë një llogari. Superuserat kanë mundësinë të krijojnë dhe menaxhojnë blogje të reja, duke siguruar që platforma të mbushet me përmbajtje cilësore dhe të dobishme.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
