import Link from "next/link"
import { AuthNav } from "@/components/auth/auth-nav"

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Next Auth
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  )
}
