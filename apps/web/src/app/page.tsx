import Hero from "@/components/Hero";
import Features from "@/components/Features";
import UseCases from "@/components/UseCases";
import Security from "@/components/Security";
import DownloadSection from "@/components/Download";
import Newsletter from "@/components/Newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <UseCases />
      <Security />
      <DownloadSection />
      <Newsletter />
    </>
  );
}
