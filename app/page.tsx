import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import UploadSection from "@/components/landing/UploadSection";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <UploadSection />
      <Features />
      <Footer />
    </main>
  );
}
