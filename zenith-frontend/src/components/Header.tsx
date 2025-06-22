"use client";

import Link from "next/link";
import { useFreighterWallet } from "@/lib/wallet";
import { SAMPLE_USER } from "@/lib/contract";

interface HeaderProps {
  showSearch?: boolean;
}

export default function Header({ showSearch = false }: HeaderProps) {
  const wallet = useFreighterWallet();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Search */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">💰</span>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Zenith
              </span>
            </Link>

            {showSearch && wallet.isConnected && (
              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder="Search invoices..."
                  className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Right side - Navigation */}
          <div className="flex items-center space-x-4">
            {wallet.isConnected ? (
              <>
                <Link href="/myInvoices">
                  <button className="text-gray-600 hover:text-blue-600 font-medium">
                    My Invoices
                  </button>
                </Link>
                <Link href="/openInvoices">
                  <button className="text-gray-600 hover:text-blue-600 font-medium">
                    Marketplace
                  </button>
                </Link>
                <Link href="/createInvoice">
                  <button className="text-gray-600 hover:text-blue-600 font-medium">
                    Create
                  </button>
                </Link>
                <div className="text-sm text-gray-600">
                  Staked:{" "}
                  <span className="font-medium text-emerald-600">
                    ${SAMPLE_USER.total_staked.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600 max-w-32 truncate">
                    {wallet.getFormattedAddress()}
                  </div>
                  {wallet.isTestnet() && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Testnet
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-600">
                    🔐 Passkey
                  </span>
                </div>
                <button
                  onClick={wallet.disconnect}
                  className="text-gray-600 hover:text-red-600 text-sm"
                  title="Disconnect Wallet"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={wallet.connect}
                disabled={wallet.isLoading}
                className="btn-primary disabled:opacity-50 flex items-center space-x-2"
              >
                <span className="text-blue-600">🚀</span>
                <span>
                  {wallet.isLoading ? "Connecting..." : "Connect Freighter"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {wallet.error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-700 text-sm">⚠️ {wallet.error}</p>
          </div>
        </div>
      )}
    </header>
  );
}
