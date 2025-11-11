"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Menu, X, Search, Radio } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthNav } from "@/components/auth/auth-nav";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          {/* <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="font-serif text-white text-lg font-bold">CB</span>
          </div> */}
          <Radio className="h-8 w-8 text-brand-500" />
          <span
            className={cn(
              "font-serif font-bold text-lg",
              isScrolled ? "text-foreground" : "text-primary dark:text-white"
            )}
          >
            Cinema Book
          </span>
        </Link>

        {!isMobile ? (
          <>
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Listen</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-brand-500 to-brand-700 p-6 no-underline outline-none focus:shadow-md"
                            href="/live"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Live Now
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Tune in to our live broadcast and join the
                              conversation
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/podcasts" title="Podcasts">
                        Browse our collection of podcasts on various topics
                      </ListItem>
                      <ListItem href="/audiobooks" title="Audiobooks">
                        Immerse yourself in captivating stories and knowledge
                      </ListItem>
                      <ListItem href="/archives" title="Archives">
                        Access our library of past broadcasts and episodes
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/programs" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      Programs
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/events" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      Events
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/about" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      About
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/contact" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      Contact
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="hidden md:flex items-center space-x-4">
              <form className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-[200px] pl-8 rounded-full bg-muted"
                />
              </form>
              <ThemeToggle />
              <AuthNav />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu
                    className={cn(
                      "h-5 w-5",
                      isScrolled
                        ? "text-foreground"
                        : "text-white dark:text-white"
                    )}
                  />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <Link href="/" className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center">
                        <span className="font-serif text-white text-sm font-bold">
                          CB
                        </span>
                      </div>
                      <span className="font-serif font-bold">WaveStream</span>
                    </Link>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </SheetTrigger>
                  </div>
                  <nav className="flex flex-col gap-4 py-4">
                    <Link href="/" className="px-2 py-1 text-lg font-medium">
                      Home
                    </Link>
                    <Link
                      href="/podcasts"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      Podcasts
                    </Link>
                    <Link
                      href="/audiobooks"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      Audiobooks
                    </Link>
                    <Link
                      href="/archives"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      Archives
                    </Link>
                    <Link
                      href="/programs"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      Programs
                    </Link>
                    <Link
                      href="/events"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      Events
                    </Link>
                    <Link
                      href="/about"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      About
                    </Link>
                    <Link
                      href="/contact"
                      className="px-2 py-1 text-lg font-medium"
                    >
                      Contact
                    </Link>
                  </nav>
                  <div className="mt-auto">
                    <AuthNav />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
