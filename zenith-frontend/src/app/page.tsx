"use client";

import Link from "next/link";
import { useFreighterWallet } from "@/lib/wallet";
import { SAMPLE_USER } from "@/lib/contract";

export default function Home() {
  const wallet = useFreighterWallet();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Search */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">💰</span>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Zenith
                </span>
              </div>

              {wallet.isConnected && (
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
                  <div className="text-sm text-gray-600">
                    Staked:{" "}
                    <span className="font-medium text-emerald-600">
                      ${SAMPLE_USER.total_staked.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 max-w-32 truncate">
                    {wallet.getFormattedAddress()}
                  </div>
                  {wallet.isTestnet() && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Testnet
                    </span>
                  )}
                  <button
                    onClick={wallet.disconnect}
                    className="text-gray-600 hover:text-red-600 text-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={wallet.connect}
                  disabled={wallet.isLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  {wallet.isLoading ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!wallet.isConnected ? (
          /* Welcome Section */
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Zenith 💰
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Tokenized Invoice Financing Marketplace on Stellar. Get immediate
              liquidity for your unpaid invoices or invest in invoice-backed
              assets.
            </p>
            {wallet.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
                {wallet.error}
              </div>
            )}
            <button
              onClick={wallet.connect}
              disabled={wallet.isLoading}
              className="btn-primary text-lg px-8 py-3 disabled:opacity-50"
            >
              {wallet.isLoading ? "Connecting..." : "Connect Freighter Wallet"}
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💎</span>
                  <div>
                    <p className="text-sm text-gray-600">My Staked Amount</p>
                    <p className="text-xl font-bold text-emerald-600">
                      ${SAMPLE_USER.total_staked.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💼</span>
                  <div>
                    <p className="text-sm text-gray-600">Available Liquidity</p>
                    <p className="text-xl font-bold text-blue-600">$250K</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📄</span>
                  <div>
                    <p className="text-sm text-gray-600">Active Invoices</p>
                    <p className="text-xl font-bold text-purple-600">
                      {SAMPLE_USER.active_stakes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <p className="text-sm text-gray-600">Trust Score</p>
                    <p className="text-xl font-bold text-green-600">
                      {SAMPLE_USER.trust_score}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Functionalities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link href="/stake">
                <div className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">💰</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Stake USDC
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Earn yield by providing liquidity to the invoice financing
                      pool
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/createInvoice">
                <div className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📋</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Create Invoice
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Tokenize your unpaid invoices and get immediate liquidity
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/openInvoices">
                <div className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">🏪</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Open Invoices
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Browse and invest in available invoice opportunities
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/withdraw">
                <div className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amber-500">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">💸</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Withdraw USDC
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Withdraw your staked funds and earned yields
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/payInvoice">
                <div className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">💳</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Pay Invoice
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Pay your invoices with crypto or fiat options
                    </p>
                  </div>
                </div>
              </Link>

              <div className="card border-dashed border-2 border-gray-300">
                <div className="text-center">
                  <span className="text-4xl mb-4 block text-gray-400">🚀</span>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">
                    More Features
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Additional features coming soon...
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📈 Platform Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">$2.5M</p>
                  <p className="text-sm text-gray-600">Total Volume</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">1,234</p>
                  <p className="text-sm text-gray-600">Invoices Funded</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">8.5%</p>
                  <p className="text-sm text-gray-600">Avg. APR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">567</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
