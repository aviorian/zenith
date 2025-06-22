"use client";

import { useState } from "react";
import Link from "next/link";
import { useFreighterWallet } from "@/lib/wallet";
import { stakeUsdc, StakeInfo } from "@/lib/soroban";
import Header from "@/components/Header";
import { calculateYield } from "@/lib/contract";
import { SAMPLE_STAKES } from "@/lib/contract";

export default function Stake() {
  const wallet = useFreighterWallet();
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeDuration, setStakeDuration] = useState("30");
  const [walletBalance] = useState(25000); // Mock wallet balance

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentAPR = 10; // 10% APR

  const calculateExpectedYield = () => {
    if (stakeAmount && stakeDuration) {
      return calculateYield(
        parseFloat(stakeAmount),
        currentAPR,
        parseInt(stakeDuration)
      );
    }
    return 0;
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!wallet.isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);
    try {
      const stakeInfo: StakeInfo = {
        amount: stakeAmount,
        durationDays: parseInt(stakeDuration, 10),
      };
      const result = await stakeUsdc(stakeInfo);
      console.log("Staked successfully:", result);
      setSuccess(
        `Successfully staked $${stakeAmount} for ${stakeDuration} days!`
      );
      setStakeAmount("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred during staking.");
    } finally {
      setIsLoading(false);
    }
  };

  const maxStake = () => {
    setStakeAmount(walletBalance.toString());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 Stake USDC
          </h1>
          <p className="text-gray-600">
            Earn yield by providing liquidity to the invoice financing pool
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staking Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Stake Your USDC
            </h2>

            <form onSubmit={handleStake} className="space-y-6">
              {/* Wallet Balance */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Your USDC Balance:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    ${walletBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Stake Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake Amount (USDC) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="10000"
                    min="100"
                    max={walletBalance}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={maxStake}
                    className="absolute right-3 top-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Minimum stake: $100 • Maximum: $
                  {walletBalance.toLocaleString()}
                </p>
              </div>

              {/* Stake Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lock Duration (Days) *
                </label>
                <select
                  value={stakeDuration}
                  onChange={(e) => setStakeDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 Days (1 Month)</option>
                  <option value="60">60 Days (2 Months)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="180">180 Days (6 Months)</option>
                  <option value="365">365 Days (1 Year)</option>
                </select>
              </div>

              {/* Current APR */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current APR:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {currentAPR}%
                  </span>
                </div>
              </div>

              {/* Expected Yield */}
              {stakeAmount && stakeDuration && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Expected Returns
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Yield Earned</p>
                      <p className="text-lg font-bold text-purple-600">
                        ${calculateExpectedYield().toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Return</p>
                      <p className="text-lg font-bold text-purple-600">
                        $
                        {(
                          parseFloat(stakeAmount) + calculateExpectedYield()
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Connection / Error / Success Messages */}
              <div className="mt-4">
                {!wallet.isConnected && (
                  <button
                    type="button"
                    onClick={wallet.connect}
                    disabled={wallet.isLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {wallet.isLoading
                      ? "Connecting..."
                      : "Connect Wallet to Stake"}
                  </button>
                )}
                {error && (
                  <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                  >
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                {success && (
                  <div
                    className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                    role="alert"
                  >
                    <strong className="font-bold">Success: </strong>
                    <span className="block sm:inline">{success}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  !wallet.isConnected ||
                  isLoading ||
                  !stakeAmount ||
                  parseFloat(stakeAmount) < 100
                }
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Staking..." : "Stake USDC"}
              </button>
            </form>

            {/* Important Notes */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-medium text-amber-800 mb-2">
                ⚠️ Important Notes
              </h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Funds will be locked for the selected duration</li>
                <li>• Early withdrawal incurs a 10% penalty</li>
                <li>• Yield is calculated daily and compounded</li>
                <li>
                  • Returns are not guaranteed and depend on pool performance
                </li>
              </ul>
            </div>
          </div>

          {/* Current Stakes & Pool Info */}
          <div className="space-y-6">
            {/* Pool Statistics */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Pool Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">$2.5M</p>
                  <p className="text-sm text-gray-600">Total Pool Value</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">$850K</p>
                  <p className="text-sm text-gray-600">Available Liquidity</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">456</p>
                  <p className="text-sm text-gray-600">Active Stakers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">95.2%</p>
                  <p className="text-sm text-gray-600">Pool Utilization</p>
                </div>
              </div>
            </div>

            {/* My Active Stakes */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                My Active Stakes
              </h2>
              <div className="space-y-4">
                {SAMPLE_STAKES.filter((stake) => stake.status === "active").map(
                  (stake) => (
                    <div
                      key={stake.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            ${stake.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {stake.lock_duration} days • {stake.apr}% APR
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Staked Date</p>
                          <p className="font-medium">
                            {new Date(stake.stake_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Maturity Date</p>
                          <p className="font-medium">
                            {new Date(stake.maturity_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Current Yield:
                          </span>
                          <span className="font-semibold text-emerald-600">
                            ${stake.current_yield.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {SAMPLE_STAKES.filter((stake) => stake.status === "active")
                  .length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">💎</span>
                    <p className="text-gray-600">No active stakes</p>
                    <p className="text-sm text-gray-500">
                      Stake USDC to start earning yield
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Risk Information
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">
                    Diversified across multiple invoice types
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">
                    Credit screening and verification process
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">⚠</span>
                  <span className="text-gray-700">
                    Invoice default risk affects returns
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">⚠</span>
                  <span className="text-gray-700">
                    Early withdrawal penalties apply
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
