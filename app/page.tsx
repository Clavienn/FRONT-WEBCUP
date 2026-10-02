import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Page() {
  return (
    <div className="app-atmosphere flex min-h-screen flex-col text-foreground">
      {/* Hero Section */}
      <header className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-5xl font-medium tracking-tight text-primary md:text-7xl">
          DevAtoandro
        </h1>
        <p className="mt-6 text-3xl font-medium text-muted-foreground md:text-5xl">
          Webcup 2026
        </p>
        <Button
          size="lg"
          className="mt-10 h-11 rounded-xl px-5 shadow-sm shadow-blue-900/10"
          nativeButton={false}
          render={<Link href="/connexion" />}
        >
          <Compass /> Explorer
        </Button>
      </header>

      {/* Footer */}
      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 DevAtoandro - Webcup</p>
      </footer>
    </div>
  );
}

export default Page;