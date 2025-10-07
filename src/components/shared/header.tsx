"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full p-6">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#0A0C14]/90 via-[#1A1F2C]/90 to-[#0A0C14]/90 rounded-3xl border border-[#16a34a]/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-[20px]">
            <div className="flex items-center space-x-2">
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
            </div>
            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}