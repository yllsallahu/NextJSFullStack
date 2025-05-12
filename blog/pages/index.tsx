import { getSession } from "next-auth/react";
import type { GetServerSidePropsContext } from "next";
import Header from "components/Header";
import Footer from "components/Footer";
import Card from "components/shared/Card";
import Navbar from "components/Navbar";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Header />
      <main className="flex-grow p-4">
        <h1 className="text-2xl font-bold mb-6">Mirësevini në Next.js</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="React"
            description="Libraria më e njohur për UI."
            imageUrl="/react.png"
          />
          <Card
            title="Next.js"
            description="Framework për SSR dhe SSG."
            imageUrl="/nextjs.png"
          />
          <Card
            title="Tailwind CSS"
            description="Stilizim i shpejtë me klasa utility."
            imageUrl="/tailwind.png"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
