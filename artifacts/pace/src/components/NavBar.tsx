import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, Plus, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { LogRunDialog } from './LogRunDialog';

export function NavBar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/runs', label: 'Runs' },
    { href: '/plan', label: 'Plan' },
    { href: '/stats', label: 'Stats' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1 group">
              <span className="font-black text-xl tracking-tight text-black">P</span>
              <div className="w-3 h-3 bg-lime-400 transform -rotate-12 rounded-sm group-hover:rotate-0 transition-transform"></div>
              <span className="font-black text-xl tracking-tight text-black">CE</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {links.map((link) => {
                const isActive = location === link.href || (link.href !== '/' && location.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-black py-2 relative ${
                      isActive ? 'text-black' : 'text-gray-400'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-lime-400 rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LogRunDialog>
              <Button className="hidden md:flex bg-lime-400 text-black hover:bg-lime-500 rounded-full font-bold px-5">
                <Plus className="w-4 h-4 mr-1" />
                Log a Run
              </Button>
            </LogRunDialog>
            <LogRunDialog>
              <Button size="icon" className="md:hidden bg-lime-400 text-black hover:bg-lime-500 rounded-full w-9 h-9">
                <Plus className="w-4 h-4" />
              </Button>
            </LogRunDialog>

            <Link href="/profile">
              <Avatar className="w-9 h-9 border-2 border-transparent hover:border-lime-400 transition-colors cursor-pointer">
                <AvatarFallback className="bg-black text-lime-400 font-bold text-xs">AM</AvatarFallback>
              </Avatar>
            </Link>

            <button 
              className="md:hidden p-2 -mr-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {links.map((link) => {
              const isActive = location === link.href || (link.href !== '/' && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium ${
                    isActive ? 'bg-gray-50 text-black' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
