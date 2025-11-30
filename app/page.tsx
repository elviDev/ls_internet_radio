import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Calendar, Headphones, BookOpen, Radio } from "lucide-react";
import FeaturedPodcasts from "@/components/featured-podcasts";
import LivePlayer from "@/components/live-player";
import UpcomingEvents from "@/components/upcoming-events";
import FeaturedPrograms from "@/components/featured-programs";
import HeroAnimation from "@/components/hero-animation";


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] bg-brand-700 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/pexels-chuck-3587478.jpg"
            alt="Professional audio recording studio background"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-700/60 to-brand-600/40"></div>
        </div>
        <div className="absolute inset-0 z-0">
          <HeroAnimation />
        </div>
        <div className="container relative z-10 flex flex-col items-center justify-center h-full px-4 mx-auto text-center text-white">
          <h1 className="font-serif text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6 animate-fade-in">
            <span className="block">Audiobook Creators</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl mt-2 text-brand-200">
              Your Sound Universe
            </span>
          </h1>
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-delay">
            <p className="text-xl md:text-2xl">
              ★ Original Soundtrack (OST) Composer
            </p>
            <p className="text-xl md:text-2xl">★ Professional Narrators</p>
            <p className="text-xl md:text-2xl">★ FX HD Sound</p>
            <p className="text-xl md:text-2xl">★ Multilanguage Translations</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-8 animate-fade-in-delay-2">
            <Link href="/podcasts">
              <Button
                size="lg"
                className="bg-white hover:bg-brand-100 text-brand-700"
              >
                <Play className="mr-2 h-5 w-5" /> Listen Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-primary bg-transparent border-white hover:bg-white/10"
              >
                Start Project
              </Button>
            </Link>
          </div>
        </div>
      </section>



      {/* Featured Content Section */}
      <section className="section-padding bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="group cursor-pointer">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-warmgray-50 to-warmgray-100 shadow-sm hover:shadow-md transition-all group-hover:scale-105">
                <div className="p-3 rounded-full bg-brand-100 mb-4 group-hover:bg-brand-200 transition-colors">
                  <Radio className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-2">
                  Live Broadcasts
                </h3>
                <p className="text-muted-foreground">
                  Tune in to our live shows using the player below and join the chat
                </p>
              </div>
            </div>
            <Link href="/podcasts" className="group">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-warmgray-50 to-warmgray-100 shadow-sm hover:shadow-md transition-all group-hover:scale-105">
                <div className="p-3 rounded-full bg-brand-100 mb-4 group-hover:bg-brand-200 transition-colors">
                  <Headphones className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-2">
                  Podcasts
                </h3>
                <p className="text-muted-foreground">
                  Explore our collection of podcasts covering various topics and
                  interests
                </p>
              </div>
            </Link>
            <Link href="/audiobooks" className="group">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-warmgray-50 to-warmgray-100 shadow-sm hover:shadow-md transition-all group-hover:scale-105">
                <div className="p-3 rounded-full bg-brand-100 mb-4 group-hover:bg-brand-200 transition-colors">
                  <BookOpen className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-2">
                  Audiobooks
                </h3>
                <p className="text-muted-foreground">
                  Immerse yourself in stories narrated by professional voice
                  artists
                </p>
              </div>
            </Link>
            <Link href="/events" className="group">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-warmgray-50 to-warmgray-100 shadow-sm hover:shadow-md transition-all group-hover:scale-105">
                <div className="p-3 rounded-full bg-brand-100 mb-4 group-hover:bg-brand-200 transition-colors">
                  <Calendar className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-2">Events</h3>
                <p className="text-muted-foreground">
                  Join our upcoming events and be part of our growing community
                </p>
              </div>
            </Link>
          </div>

          <div className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-serif font-bold">
                Featured Podcasts
              </h2>
              <Link
                href="/podcasts"
                className="text-brand-600 hover:text-brand-800 font-medium"
              >
                View All Podcasts →
              </Link>
            </div>
            <FeaturedPodcasts />
          </div>

          <div className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-serif font-bold">Upcoming Events</h2>
              <Link
                href="/events"
                className="text-brand-600 hover:text-brand-800 font-medium"
              >
                View All Events →
              </Link>
            </div>
            <UpcomingEvents />
          </div>

          <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-serif font-bold">
                Popular Programs
              </h2>
              <Link
                href="/programs"
                className="text-brand-600 hover:text-brand-800 font-medium"
              >
                View All Programs →
              </Link>
            </div>
            <FeaturedPrograms />
          </div>
        </div>
      </section>

      {/* Professional Team Section */}
      <section className="section-padding bg-warmgray-100">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/placeholder.svg?height=600&width=600&text=Team+Image"
                alt="Professional Team"
                width={600}
                height={600}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">
                Professional Team
              </h2>
              <p className="text-lg mb-6">
                Cinema Book Studio is a dual partnership. Ours is the objective
                of creating distinct Audiobooks. Your book can have just one
                narrator or several voice readers with optional FX sounds, or an
                original soundtrack, much like a film.
              </p>
              <p className="text-lg mb-8">
                We give personalized study to your project, to elevate the
                excellence of your Audiobook.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-brand-600 mr-2">•</div>
                  <p>The Raven (A Poem by Edgar Allan Poe)</p>
                </div>
                <div className="flex items-start">
                  <div className="text-brand-600 mr-2">•</div>
                  <p>A Fragment of the Hanging Gardens of Babylon in Spanish</p>
                </div>
                <div className="flex items-start">
                  <div className="text-brand-600 mr-2">•</div>
                  <p>Auld Lang Syne (by Robert Burns)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding bg-brand-700 text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Let us make your project real!
          </h2>
          <p className="max-w-[600px] mx-auto mb-8 text-brand-100">
            Subscribe to our newsletter and never miss updates on new podcasts,
            events, and special broadcasts.
          </p>
          <Link href="/contact">
            <Button className="bg-white hover:bg-brand-100 text-brand-700 px-8 py-6 text-lg">
              Contact
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
