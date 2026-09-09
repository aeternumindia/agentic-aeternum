import Link from "next/link";
import { ArrowRight, ShoppingBag, MessageSquareText, Eye, Sparkles } from "lucide-react";
import { ImagesSlider } from "@/components/ui/images-slider";
import { FlipWords } from "@/components/ui/flip-words";
import { GridBackground } from "@/components/ui/grid";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { HowItWorksSection } from "@/components/ui/how-it-works-section";
import { FaqSection } from "@/components/ui/faq-section";
import { Footer } from "@/components/ui/footer";

const features = [
  {
    title: "AI Shopping Assistant",
    tag: "Personal Stylist",
    description: "Get personalized product recommendations, sizing guidance, and style advice through natural conversation.",
    icon: <MessageSquareText className="h-3.5 w-3.5 text-white" />,
    cta: "Launch Assistant",
    image: "https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/Black_Shirt_25-10-2025--vika_igor00608.jpg?v=1769685733",
  },
  {
    title: "Virtual Try-On",
    tag: "AI Fitting Room",
    description: "See how any garment looks on you with AI-powered virtual try-on. Upload a photo and preview outfits instantly.",
    icon: <Eye className="h-3.5 w-3.5 text-white" />,
    cta: "Start Virtual Try-On",
    image: "https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/Neutral_Linen_25-10-2025--vika_igor00694.jpg?v=1780747636",
  },
  {
    title: "Color Analysis",
    tag: "Palette Matcher",
    description: "Discover your perfect color palette with AI-driven skin tone and seasonal color analysis tailored to you.",
    icon: <Sparkles className="h-3.5 w-3.5 text-white" />,
    cta: "Analyze Color Palette",
    image: "https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/aeternum-signature-formals.webp?v=1780747830",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 md:px-8 py-12 md:py-20 w-full max-w-6xl mx-auto">
      {/* Hero */}
      <div className="flex flex-col md:flex-row items-center gap-12 w-full mb-20">
        <div className="w-full md:flex-1 md:max-w-xl">
          <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold tracking-tight leading-[1.05] mb-6 text-foreground">
            Look Your Best{" "}
            <FlipWords
              words={["Effortlessly", "Confidently", "Authentically"]}
              className="text-primary px-0"
            />{" "}
            with Aeternum
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8">
            The official AI shopping assistant for Aeternum India. Discover, try on, and
            customize garments from our collection, tailored to your body and style.
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <Link
              href="/ai-shopping/ucp"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full px-6 md:px-8 py-2.5 md:py-3.5 text-sm md:text-base font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started <ArrowRight className="ml-1.5 md:ml-2 w-3.5 h-3.5 md:w-4 md:h-4" />
            </Link>
            <a
              href="https://aeternumindia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-border text-foreground rounded-full px-6 md:px-8 py-2.5 md:py-3.5 text-sm md:text-base font-semibold hover:bg-accent/10 transition-colors"
            >
              <ShoppingBag className="mr-1.5 md:mr-2 w-3.5 h-3.5 md:w-4 md:h-4" /> Visit Shop
            </a>
          </div>
        </div>
        <div className="w-full md:flex-1 h-[20rem] md:h-[28rem] rounded-[2rem] overflow-hidden shadow-lg border border-border">
          <ImagesSlider
            images={[
              "https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/25-10-2025--vika_igor00101_81f7128c-653a-4364-a358-8769b40166fc.jpg?v=1769685731",
              "https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/25-10-2025--vika_igor00249_43506855-a030-45c2-a991-2d6ac05199e0.jpg?v=1769685736",
              "https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/25-10-2025--vika_igor00025.jpg?v=1780747287",
            ]}
            direction="up"
            overlay={false}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Features Section - Luxury Interactive Cards with 100% Text Legibility */}
      <section className="w-full mb-20 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Interactive Styling Suite</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything You Need
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Three personal styling tools designed to help you discover, fit, and style your perfect outfit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => {
            const href =
              i === 0
                ? "/ai-shopping/ucp"
                : i === 1
                  ? "/virtual-try-on"
                  : "/color-analysis";

            return (
              <Link key={i} href={href} className="group block h-full">
                <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-border/70 shadow-md transition-all duration-500 hover:shadow-2xl hover:border-white/50 cursor-pointer">
                  {/* Full-bleed portrait image */}
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Rich Black Hue Gradient Overlay for guaranteed white text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 transition-opacity duration-300 group-hover:from-black" />

                  {/* Hover Arrow Badge on Top-Right */}
                  <div className="absolute top-4 right-4 z-10 w-8.5 h-8.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-black shadow-md">
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>

                  {/* Overlaid Card Content - All White Typography & Button */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10 flex flex-col justify-end space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed drop-shadow-sm line-clamp-2">
                      {feature.description}
                    </p>

                    {/* Overlaid White CTA Button */}
                    <div className="pt-1">
                      <div className="w-full py-3 px-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/35 text-white text-xs font-semibold flex items-center justify-between transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:border-white shadow-lg">
                        <span>{feature.cta}</span>
                        <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all duration-300">
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <div className="w-full mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            How it works
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Three simple steps to your perfect look
          </p>
        </div>
        <HowItWorksSection />
      </div>

      {/* Bottom CTA */}
      <div className="w-full mb-16 flex justify-center">
        <Link
          href="/ai-shopping/ucp"
          className="inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full px-10 py-4 font-bold text-lg hover:bg-primary/90 transition-colors"
        >
          Get Started <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>

      {/* FAQ */}
      <div className="w-full mb-16">
        <FaqSection />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
