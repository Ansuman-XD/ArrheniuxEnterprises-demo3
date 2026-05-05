import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Hero } from "@/components/sections/Hero";
import { CategoriesGrid } from "@/components/sections/CategoriesGrid";
import { NewReleases, LatestCollection } from "@/components/sections/Releases";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Gallery } from "@/components/sections/Gallery";
import { FactorySection } from "@/components/sections/FactorySection";
import { Reviews } from "@/components/sections/Reviews";
import { ClientReactions } from "@/components/sections/ClientReactions";

const Index = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [hash]);

  return (
    <Layout>
      <section id="home"><Hero /></section>
      <section id="categories"><CategoriesGrid /></section>
      <section id="releases"><NewReleases /></section>
      <section id="collection"><LatestCollection /></section>
      <section id="process"><HowItWorks /></section>
      <section id="clients"><Gallery /></section>
      <section id="factory"><FactorySection /></section>
      <section id="reviews"><Reviews /></section>
      <ClientReactions />
    </Layout>
  );
};

export default Index;

