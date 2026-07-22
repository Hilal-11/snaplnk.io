import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <Header />
      <Hero />
    </div>
  );
}
