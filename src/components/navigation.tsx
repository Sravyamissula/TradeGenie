'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  MessageSquare, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '#features' },
    { name: 'About Us', href: '/about' },
    { name: 'Pricing', href: '#' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">TradeGenie</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link href="/chat">
                      <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask Genie
                      </Button>
                    </Link>
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Link href="/signin">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/chat">
                      <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                        Ask Genie
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Free Trial
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/chat">
              <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                <MessageSquare className="h-4 w-4 mr-1" />
                Ask
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="text-muted-foreground hover:text-primary"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border py-4">
            <div className="flex flex-col space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors font-medium px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border pt-3 mt-3">
                {!isLoading && (
                  <>
                    {isAuthenticated ? (
                      <div className="px-4 space-y-2">
                        <UserMenu />
                      </div>
                    ) : (
                      <>
                        <Link href="/signin" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className="w-full text-primary hover:bg-primary/10 justify-start">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="mt-2 block">
                          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            Free Trial
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}