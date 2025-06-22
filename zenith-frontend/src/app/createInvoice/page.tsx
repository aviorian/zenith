"use client";

import { useState } from "react";
import Link from "next/link";
import { useFreighterWallet } from "@/lib/wallet";
import Header from "@/components/Header";
import { calculateOfferAmount } from "@/lib/contract";

export default function CreateInvoice() {
  const wallet = useFreighterWallet();
  const [formData, setFormData] = useState({
    amount: "",
    deadline: "",
    customerName: "",
    customerEmail: "",
    description: "",
    currency: "USDC",
    country: "",
    taxRate: "",
    earlyDiscount: "3",
    isRecurring: false,
    collateralType: "",
    esgFlag: false,
    preferredAnchor: "",
  });

  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProofFile(file || null);
  };

  const calculateOffer = () => {
    if (formData.amount && formData.deadline) {
      return calculateOfferAmount(
        parseFloat(formData.amount),
        formData.deadline
      );
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected || !wallet.publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    // Mock submission with wallet integration
    const invoiceData = {
      ...formData,
      creator: wallet.publicKey,
      network: wallet.getNetworkName(),
      createdAt: new Date().toISOString(),
      offerAmount: calculateOffer(),
      proofFile: proofFile?.name,
    };

    console.log("Creating invoice NFT with data:", invoiceData);
    alert(
      `Invoice NFT creation initiated!\n\nCreator: ${wallet.getFormattedAddress()}\nNetwork: ${wallet.getNetworkName()}\nAmount: $${
        formData.amount
      }\nOffer: $${calculateOffer().toFixed(
        2
      )}\n\n(This will integrate with Soroban smart contracts)`
    );

    // Reset form
    setFormData({
      amount: "",
      deadline: "",
      customerName: "",
      customerEmail: "",
      description: "",
      currency: "USDC",
      country: "",
      taxRate: "",
      earlyDiscount: "3",
      isRecurring: false,
      collateralType: "",
      esgFlag: false,
      preferredAnchor: "",
    });
    setProofFile(null);
  };

  // Check if wallet is connected
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <span className="text-6xl mb-4 block">🔒</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Wallet Connection Required
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your Freighter wallet to create invoices
            </p>
            <button
              onClick={wallet.connect}
              disabled={wallet.isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {wallet.isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Create Invoice
          </h1>
          <p className="text-gray-600">
            Tokenize your unpaid invoice and get immediate liquidity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enterprise Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="finance@enterprise.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the work/service provided..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Financial Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USDC">USDC</option>
                  <option value="EURC">EURC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country/Jurisdiction *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  placeholder="8.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Early Payment Discount (%) *
                </label>
                <input
                  type="number"
                  name="earlyDiscount"
                  value={formData.earlyDiscount}
                  onChange={handleInputChange}
                  placeholder="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Additional Options
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  This is a recurring invoice
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="esgFlag"
                  checked={formData.esgFlag}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  ESG compliant service/product
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral Type (Optional)
                  </label>
                  <input
                    type="text"
                    name="collateralType"
                    value={formData.collateralType}
                    onChange={handleInputChange}
                    placeholder="Equipment, Inventory, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Payout Anchor
                  </label>
                  <input
                    type="text"
                    name="preferredAnchor"
                    value={formData.preferredAnchor}
                    onChange={handleInputChange}
                    placeholder="MoneyGram, Cowrie, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Invoice Proof
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Invoice Document *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG (Max 10MB)
              </p>
            </div>
          </div>

          {/* Offer Calculation */}
          {formData.amount && formData.deadline && (
            <div className="card bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                💰 Calculated Offer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(formData.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Offer Amount (You Receive)
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    ${calculateOffer().toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discount Rate</p>
                  <p className="text-lg font-bold text-amber-600">
                    {(
                      ((parseFloat(formData.amount) - calculateOffer()) /
                        parseFloat(formData.amount)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            <button type="submit" className="btn-primary px-8 py-2">
              Create Invoice NFT
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
