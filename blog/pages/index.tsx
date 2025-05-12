import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/shared/Card";

export default function HomePage() {
  return (
    <div>
      <Header />
      <main className="p-4">
        <h1 className="text-2xl font-bold">Mirësevini në Next.js</h1>
        <div className="grid grid-cols-3 gap-4 mt-4">
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
