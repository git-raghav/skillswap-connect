import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedSkills from "@/components/home/FeaturedSkills";
import Categories from "@/components/home/Categories";
import CTA from "@/components/home/CTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedSkills />
        <Categories />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
