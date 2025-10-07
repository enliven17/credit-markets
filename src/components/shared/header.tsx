"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full p-6">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#0A0C14]/90 via-[#1A1F2C]/90 to-[#0A0C14]/90 animate-gradient rounded-3xl border border-[#16a34a]/20 p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle animated overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/5 via-transparent to-[#16a34a]/5 animate-gradient opacity-50"></div>
          <div className="relative z-10 flex items-center justify-between gap-[20px]">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                {/* Text Only */}
                <div className="sm:text-3xl text-xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-[#34d399] via-[#22c55e] to-[#16a34a] bg-clip-text text-transparent">
                    Credit
                  </span>
                  <span className="text-white"> Predict</span>
                </div>
              </Link>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/markets" 
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Markets
                </Link>
                <Link 
                  href="/dashboard/my-bets" 
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  My Bets
                </Link>
                <Link 
                  href="/learn" 
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Learn
                </Link>
              </nav>
            </div>
            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}