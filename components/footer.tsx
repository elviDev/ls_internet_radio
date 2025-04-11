import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brand-700 text-white pt-12 pb-6 mt-auto">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                <span className="font-serif text-brand-700 text-lg font-bold">
                  CB
                </span>
              </div>
              <span className="font-serif font-bold text-xl text-white">
                Cinema Book
              </span>
            </div>
            <p className="text-brand-100 mb-4">
              Your premier destination for podcasts, audiobooks, and live
              broadcasts that inspire, entertain, and connect.
            </p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-brand-200 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-brand-200 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="text-brand-200 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="#"
                className="text-brand-200 hover:text-white transition-colors"
              >
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-white text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/programs"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/podcasts"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Podcasts
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-white text-lg mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/advertise"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Advertise With Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-brand-100 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-semibold text-white text-lg mb-4">
              Subscribe
            </h3>
            <p className="text-brand-100 mb-4">
              Subscribe to our newsletter for updates on new content and events.
            </p>
            <form className="space-y-2">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-brand-600 border-brand-500 text-white placeholder:text-brand-300"
              />
              <Button className="w-full bg-white hover:bg-brand-100 text-brand-700">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-brand-600 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-brand-200 text-sm">
            © {new Date().getFullYear()} WaveStream Radio. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-brand-200 hover:text-white text-sm transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-brand-200 hover:text-white text-sm transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-brand-200 hover:text-white text-sm transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-600 flex flex-wrap justify-center gap-6">
          <img
            src="/placeholder.svg?height=40&width=120&text=Partner+Logo"
            alt="Partner Logo"
            className="h-10 opacity-70 hover:opacity-100 transition-opacity"
          />
          <img
            src="/placeholder.svg?height=40&width=120&text=Partner+Logo"
            alt="Partner Logo"
            className="h-10 opacity-70 hover:opacity-100 transition-opacity"
          />
          <img
            src="/placeholder.svg?height=40&width=120&text=Partner+Logo"
            alt="Partner Logo"
            className="h-10 opacity-70 hover:opacity-100 transition-opacity"
          />
          <img
            src="/placeholder.svg?height=40&width=120&text=Partner+Logo"
            alt="Partner Logo"
            className="h-10 opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  );
}
