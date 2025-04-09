import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Calendar, Headphones, BookOpen, Radio } from "lucide-react"
import FeaturedPodcasts from "@/components/featured-podcasts"
import LivePlayer from "@/components/live-player"
import UpcomingEvents from "@/components/upcoming-events"
import FeaturedPrograms from "@/components/featured-programs"
import HeroAnimation from "@/components/hero-animation"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] bg-gradient-to-r from-purple-900 via-violet-800 to-fuchsia-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroAnimation />
        </div>
        <div className="container relative z-10 flex flex-col items-center justify-center h-full px-4 mx-auto text-center text-white">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6 animate-fade-in">
            <span className="block">WaveStream Radio</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl mt-2 text-purple-200">Your Sound Universe</span>
          </h1>
          <p className="max-w-[600px] text-lg md:text-xl text-purple-100 mb-8 animate-fade-in-delay">
            Discover podcasts, audiobooks, and live broadcasts that inspire, entertain, and connect you to a world of
            sound.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-delay-2">
            <Button size="lg" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
              <Play className="mr-2 h-5 w-5" /> Listen Live
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              Explore Podcasts
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,208C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Live Player (Persistent) */}
      <LivePlayer />

      {/* Featured Content Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 rounded-full bg-purple-100 mb-4">
                <Radio className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Broadcasts</h3>
              <p className="text-muted-foreground">
                Tune in to our live shows and stay connected with real-time content
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 rounded-full bg-purple-100 mb-4">
                <Headphones className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Podcasts</h3>
              <p className="text-muted-foreground">
                Explore our collection of podcasts covering various topics and interests
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 rounded-full bg-purple-100 mb-4">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Audiobooks</h3>
              <p className="text-muted-foreground">
                Immerse yourself in stories narrated by professional voice artists
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 rounded-full bg-purple-100 mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Events</h3>
              <p className="text-muted-foreground">Join our upcoming events and be part of our growing community</p>
            </div>
          </div>

          <div className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Featured Podcasts</h2>
              <Link href="/podcasts" className="text-purple-600 hover:text-purple-800 font-medium">
                View All Podcasts →
              </Link>
            </div>
            <FeaturedPodcasts />
          </div>

          <div className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <Link href="/events" className="text-purple-600 hover:text-purple-800 font-medium">
                View All Events →
              </Link>
            </div>
            <UpcomingEvents />
          </div>

          <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Popular Programs</h2>
              <Link href="/programs" className="text-purple-600 hover:text-purple-800 font-medium">
                View All Programs →
              </Link>
            </div>
            <FeaturedPrograms />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-purple-900 via-violet-800 to-fuchsia-900 text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Connected</h2>
          <p className="max-w-[600px] mx-auto mb-8 text-purple-100">
            Subscribe to our newsletter and never miss updates on new podcasts, events, and special broadcasts.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  )
}

