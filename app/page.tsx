import React from 'react';
import Link from 'next/link';
import { UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white">
      {/* Hero Section */}
      <header className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          DevAtoandro
        </h1>
        <p className="mt-6 text-3xl md:text-5xl font-semibold text-gray-200">
          Webcup 2026
        </p>
        <Button
          size="lg"
          className="mt-10"
          nativeButton={false}
          render={<Link href="/personnes" />}
        >
          <UsersIcon /> Gérer personne
        </Button>
      </header>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 border-t border-white/10">
        <p>&copy; 2026 DevAtoandro - Webcup</p>
      </footer>
    </div>
  );
}

export default Page;