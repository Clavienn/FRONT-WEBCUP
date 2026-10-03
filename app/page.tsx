import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Page() {
  return (
    <div className="app-atmosphere flex min-h-screen flex-col text-foreground">
      {/* Hero Section */}
      <header className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-muted-foreground">
          24H BY WEBCUP
        </p>
        <h1 className="text-5xl font-medium tracking-tight text-primary md:text-7xl">
          TERRA NOVA
        </h1>
        <p className="mt-5 text-2xl font-medium text-foreground md:text-4xl">
          La première ville d’un nouveau monde
        </p>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          La plateforme centrale pour accéder aux services de la ville, s’informer et signaler un problème.
        </p>
        <Button
          size="lg"
          className="mt-10 h-11 rounded-xl px-5 shadow-sm shadow-blue-900/10"
          nativeButton={false}
          render={<Link href="/connexion" />}
        >
          <Compass /> Accéder à la console
        </Button>
      </header>

      {/* Footer */}
      <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 Terra Nova - Webcup</p>
      </footer>
    </div>
  );
}

export default Page;