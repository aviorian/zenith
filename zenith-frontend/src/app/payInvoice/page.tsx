"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_INVOICES, calculateCashback } from "@/lib/contract";

export default function PayInvoice() {
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "fiat" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock invoices that need payment - filtered by customer/connected user
  const invoicesToPay = SAMPLE_INVOICES.filter(
    (invoice) => invoice.status === "funded" || invoice.status === "open"
  );

  const handleCryptoPayment = async () => {
    setIsProcessing(true);

    // Mock crypto payment process
    setTimeout(() => {
      alert("Payment successful via crypto! Smart contract executed.");
      setIsProcessing(false);
      setSelectedInvoice("");
      setPaymentMethod(null);
    }, 2000);
  };

  const handleFiatPayment = (invoiceId: string) => {
    const invoice = SAMPLE_INVOICES.find((i) => i.id === invoiceId);
    if (!invoice) return;

    // Mock redirect to fiat on-ramp
    alert(
      `Redirecting to fiat payment gateway for $${invoice.invoice_details.amount}...`
    );

    // In real implementation, this would redirect to Moonpay/Ramp
    setTimeout(() => {
      alert(
        "Fiat payment completed! Backend detected payment and executed smart contract."
      );
    }, 3000);
  };

  const isEarlyPayment = (dueDate: string) => {
    return new Date() < new Date(dueDate);
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
              <Link
                href="/myInvoices"
                className="text-gray-600 hover:text-blue-600"
              >
                My Invoices
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Pay Invoice
          </h1>
          <p className="text-gray-600">
            Pay your invoices with crypto or fiat payment options
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Selection */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Select Invoice to Pay
              </h2>

              {invoicesToPay.length > 0 ? (
                <div className="space-y-4">
                  {invoicesToPay.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedInvoice === invoice.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedInvoice(invoice.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {invoice.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            From: {invoice.creator_info.business_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`status-${invoice.status}`}>
                            {invoice.status}
                          </span>
                          {isEarlyPayment(invoice.invoice_details.due_date) && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              💰 Early Payment Bonus
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Amount Due</p>
                          <p className="text-lg font-bold text-gray-900">
                            ${invoice.invoice_details.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Due Date</p>
                          <p className="font-medium">
                            {new Date(
                              invoice.invoice_details.due_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>{invoice.invoice_details.description}</p>
                      </div>

                      {isEarlyPayment(invoice.invoice_details.due_date) && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">
                            💰 Pay early and get $
                            {calculateCashback(
                              invoice.invoice_details.amount,
                              true
                            ).toFixed(2)}{" "}
                            cashback!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📄</span>
                  <p className="text-gray-600 mb-2">No invoices to pay</p>
                  <p className="text-sm text-gray-500">
                    All your invoices are up to date!
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            {selectedInvoice && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Choose Payment Method
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Crypto Payment */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === "crypto"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("crypto")}
                  >
                    <div className="text-center">
                      <span className="text-3xl mb-2 block">💰</span>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Pay with Crypto
                      </h3>
                      <p className="text-sm text-gray-600">
                        Use your connected Freighter wallet to pay with USDC
                      </p>
                      <div className="mt-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Instant • On-chain
                      </div>
                    </div>
                  </div>

                  {/* Fiat Payment */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === "fiat"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("fiat")}
                  >
                    <div className="text-center">
                      <span className="text-3xl mb-2 block">💳</span>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Pay with Fiat
                      </h3>
                      <p className="text-sm text-gray-600">
                        Use your credit card, bank transfer, or mobile money
                      </p>
                      <div className="mt-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Card • Bank • Mobile Money
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary & Execution */}
          <div className="space-y-6">
            {selectedInvoice && (
              <>
                {/* Payment Summary */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Payment Summary
                  </h2>
                  {(() => {
                    const invoice = SAMPLE_INVOICES.find(
                      (i) => i.id === selectedInvoice
                    );
                    if (!invoice) return null;

                    const isEarly = isEarlyPayment(
                      invoice.invoice_details.due_date
                    );
                    const cashback = calculateCashback(
                      invoice.invoice_details.amount,
                      isEarly
                    );
                    const totalAmount = invoice.invoice_details.amount;

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice:</span>
                          <span className="font-semibold">{invoice.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Business:</span>
                          <span className="font-semibold">
                            {invoice.creator_info.business_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className="font-semibold">
                            {new Date(
                              invoice.invoice_details.due_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold">
                            ${totalAmount.toLocaleString()}
                          </span>
                        </div>
                        {isEarly && (
                          <div className="flex justify-between text-green-600">
                            <span>Early Payment Cashback:</span>
                            <span className="font-semibold">
                              -${cashback.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <hr className="border-gray-200" />
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold">Total to Pay:</span>
                          <span className="font-bold text-blue-600">
                            ${(totalAmount - cashback).toFixed(2)}
                          </span>
                        </div>
                        {isEarly && (
                          <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                            🎉 You&apos;re paying early! Cashback will be
                            processed after payment confirmation.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Payment Execution */}
                {paymentMethod && (
                  <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {paymentMethod === "crypto"
                        ? "💰 Crypto Payment"
                        : "💳 Fiat Payment"}
                    </h2>

                    {paymentMethod === "crypto" ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-800 mb-2">
                            Payment Process:
                          </h3>
                          <ol className="text-sm text-blue-700 space-y-1">
                            <li>1. Confirm transaction in Freighter wallet</li>
                            <li>2. USDC transferred to platform treasury</li>
                            <li>
                              3. Smart contract marks invoice as
                              &quot;done&quot;
                            </li>
                            <li>4. Invoice NFT burned/archived</li>
                            <li>5. Cashback issued (if early payment)</li>
                          </ol>
                        </div>

                        <button
                          onClick={() => handleCryptoPayment()}
                          disabled={isProcessing}
                          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing
                            ? "Processing Payment..."
                            : "Pay with USDC"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-800 mb-2">
                            Payment Process:
                          </h3>
                          <ol className="text-sm text-green-700 space-y-1">
                            <li>1. Redirect to secure payment gateway</li>
                            <li>
                              2. Complete payment with your preferred method
                            </li>
                            <li>3. Platform backend detects payment</li>
                            <li>4. Smart contract executed automatically</li>
                            <li>5. Invoice marked as paid & cashback issued</li>
                          </ol>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <span className="text-2xl block mb-1">💳</span>
                            <span className="text-xs text-gray-600">
                              Credit Card
                            </span>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <span className="text-2xl block mb-1">🏦</span>
                            <span className="text-xs text-gray-600">
                              Bank Transfer
                            </span>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <span className="text-2xl block mb-1">📱</span>
                            <span className="text-xs text-gray-600">
                              Mobile Money
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleFiatPayment(selectedInvoice)}
                          className="w-full btn-secondary"
                        >
                          Pay with Fiat
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Information */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Payment Information
                  </h2>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Security
                      </h3>
                      <p className="text-gray-600">
                        All payments are secured by smart contracts on Stellar
                        blockchain. Fiat payments are processed through
                        regulated payment partners.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Early Payment Rewards
                      </h3>
                      <p className="text-gray-600">
                        Pay before the due date and receive a 3% cashback
                        automatically credited to your wallet after payment
                        confirmation.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Processing Time
                      </h3>
                      <p className="text-gray-600">
                        Crypto payments: Instant (5 seconds)
                        <br />
                        Fiat payments: 1-3 business days for confirmation
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Recent Payments */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Payments
              </h2>
              <div className="space-y-3">
                {[
                  {
                    id: "pay_001",
                    title: "Q4 Consulting Services",
                    amount: 8500,
                    date: "2024-01-10",
                    method: "crypto",
                  },
                  {
                    id: "pay_002",
                    title: "Website Redesign",
                    amount: 3200,
                    date: "2024-01-08",
                    method: "fiat",
                  },
                ].map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.title}
                      </p>
                      <p className="text-sm text-gray-600">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          payment.method === "crypto"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {payment.method === "crypto" ? "Crypto" : "Fiat"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
