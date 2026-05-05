import { Layout } from "@/components/Layout";
import { Hero } from "@/components/sections/Hero";
import { CategoriesGrid } from "@/components/sections/CategoriesGrid";
import { NewReleases, LatestCollection } from "@/components/sections/Releases";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Gallery } from "@/components/sections/Gallery";
import { FactorySection } from "@/components/sections/FactorySection";
import { Reviews } from "@/components/sections/Reviews";

const Index = () => (
  <Layout>
    <Hero />
    <CategoriesGrid />
    <NewReleases />
    <LatestCollection />
    <HowItWorks />
    <Gallery />
    <FactorySection />
    <Reviews />
  </Layout>
);

export default Index;
