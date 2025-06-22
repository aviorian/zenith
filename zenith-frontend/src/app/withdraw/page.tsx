"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_STAKES, calculatePenalty } from "@/lib/contract";
import { StakePosition } from "@/lib/types";

export default function Withdraw() {
  const [selectedStake, setSelectedStake] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async (stakeId: string) => {
    setIsWithdrawing(true);

    const stake = SAMPLE_STAKES.find((s) => s.id === stakeId);
    if (!stake) return;

    const isEarly = new Date() < new Date(stake.maturity_date);
    const penalty = calculatePenalty(stake.amount, isEarly);

    // Mock withdrawal process
    setTimeout(() => {
      alert(
        `Withdrawal successful! ${
          isEarly ? `Penalty of $${penalty.toFixed(2)} applied.` : ""
        }`
      );
      setIsWithdrawing(false);
    }, 2000);
  };

  const getTotalWithdrawable = (stake: StakePosition) => {
    const isEarly = new Date() < new Date(stake.maturity_date);
    const penalty = calculatePenalty(stake.amount, isEarly);
    return stake.amount + stake.current_yield - penalty;
  };

  const isPenaltyApplicable = (stake: StakePosition) => {
    return new Date() < new Date(stake.maturity_date);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">💰</span>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Zenith
              </span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/stake" className="text-gray-600 hover:text-blue-600">
                Stake USDC
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💸 Withdraw USDC
          </h1>
          <p className="text-gray-600">
            Withdraw your staked funds and earned yields
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Options */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Your Active Stakes
              </h2>

              {SAMPLE_STAKES.length > 0 ? (
                <div className="space-y-4">
                  {SAMPLE_STAKES.map((stake) => (
                    <div
                      key={stake.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedStake === stake.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedStake(stake.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${stake.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {stake.lock_duration} days • {stake.apr}% APR
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              stake.status === "active"
                                ? "bg-green-100 text-green-800"
                                : stake.status === "matured"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {stake.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
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

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Current Yield:</span>
                          <span className="font-semibold text-emerald-600">
                            ${stake.current_yield.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-600">Withdrawable:</span>
                          <span className="font-semibold text-blue-600">
                            ${getTotalWithdrawable(stake).toFixed(2)}
                          </span>
                        </div>
                        {isPenaltyApplicable(stake) && (
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-red-600">Early Penalty:</span>
                            <span className="font-semibold text-red-600">
                              -$
                              {calculatePenalty(stake.amount, true).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">💎</span>
                  <p className="text-gray-600 mb-2">No stakes to withdraw</p>
                  <p className="text-sm text-gray-500">
                    Stake USDC first to earn yield
                  </p>
                  <Link href="/stake">
                    <button className="btn-primary mt-4">Stake USDC</button>
                  </Link>
                </div>
              )}
            </div>

            {/* Withdrawal Summary */}
            {selectedStake && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Withdrawal Summary
                </h2>
                {(() => {
                  const stake = SAMPLE_STAKES.find(
                    (s) => s.id === selectedStake
                  );
                  if (!stake) return null;

                  const isEarly = isPenaltyApplicable(stake);
                  const penalty = calculatePenalty(stake.amount, isEarly);
                  const totalWithdrawable = getTotalWithdrawable(stake);

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Stake:</span>
                        <span className="font-semibold">
                          ${stake.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Earned Yield:</span>
                        <span className="font-semibold text-emerald-600">
                          +${stake.current_yield.toFixed(2)}
                        </span>
                      </div>
                      {isEarly && (
                        <div className="flex justify-between">
                          <span className="text-red-600">
                            Early Withdrawal Penalty:
                          </span>
                          <span className="font-semibold text-red-600">
                            -${penalty.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <hr className="border-gray-200" />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">
                          Total Withdrawable:
                        </span>
                        <span className="font-bold text-blue-600">
                          ${totalWithdrawable.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Withdrawal Form & Info */}
          <div className="space-y-6">
            {/* Withdrawal Form */}
            {selectedStake && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Confirm Withdrawal
                </h2>

                {(() => {
                  const stake = SAMPLE_STAKES.find(
                    (s) => s.id === selectedStake
                  );
                  if (!stake) return null;

                  const isEarly = isPenaltyApplicable(stake);

                  return (
                    <>
                      {isEarly && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <h3 className="text-red-800 font-semibold mb-2">
                            ⚠️ Early Withdrawal Warning
                          </h3>
                          <p className="text-red-700 text-sm">
                            Your stake hasn&apos;t reached maturity yet.
                            Withdrawing now will incur a 10% penalty ($
                            {calculatePenalty(stake.amount, true).toFixed(2)})
                            on your original stake amount.
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Withdrawal Details
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Stake Amount:</span>
                              <span>${stake.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Days Staked:</span>
                              <span>
                                {Math.floor(
                                  (new Date().getTime() -
                                    new Date(stake.stake_date).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span
                                className={
                                  isEarly ? "text-amber-600" : "text-green-600"
                                }
                              >
                                {isEarly ? "Early" : "Matured"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleWithdraw(stake.id)}
                          disabled={isWithdrawing}
                          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            isEarly
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "btn-primary"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isWithdrawing
                            ? "Processing..."
                            : isEarly
                            ? "Withdraw Early (with penalty)"
                            : "Withdraw Funds"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Withdrawal Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Withdrawal Information
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Processing Time
                  </h3>
                  <p className="text-gray-600">
                    Withdrawals are processed instantly on the Stellar network.
                    You&apos;ll receive your USDC directly to your connected
                    wallet.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Early Withdrawal Penalty
                  </h3>
                  <p className="text-gray-600">
                    If you withdraw before the maturity date, a 10% penalty is
                    applied to your original stake amount (not including earned
                    yield).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Network Fees
                  </h3>
                  <p className="text-gray-600">
                    Minimal Stellar network fees apply (~0.00001 XLM per
                    transaction).
                  </p>
                </div>
              </div>
            </div>

            {/* Portfolio Overview */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Portfolio Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    $
                    {SAMPLE_STAKES.reduce(
                      (sum, stake) => sum + stake.amount,
                      0
                    ).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Staked</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    $
                    {SAMPLE_STAKES.reduce(
                      (sum, stake) => sum + stake.current_yield,
                      0
                    ).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Total Yield</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {SAMPLE_STAKES.filter((s) => s.status === "active").length}
                  </p>
                  <p className="text-sm text-gray-600">Active Stakes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {SAMPLE_STAKES.filter((s) => s.status === "matured").length}
                  </p>
                  <p className="text-sm text-gray-600">Matured Stakes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
