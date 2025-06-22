"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_INVOICES } from "@/lib/contract";

export default function OpenInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    riskLevel: "all",
    amountRange: "all",
    daysUntilDue: "all",
    currency: "all",
    industry: "all",
  });

  const filteredInvoices = SAMPLE_INVOICES.filter((invoice) => {
    const matchesSearch =
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.creator_info.business_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filters.status === "all" || invoice.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case "A":
        return "text-green-600 bg-green-100";
      case "B":
        return "text-blue-600 bg-blue-100";
      case "C":
        return "text-amber-600 bg-amber-100";
      case "D":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "open":
        return "status-open";
      case "funded":
        return "status-funded";
      case "completed":
        return "status-completed";
      case "overdue":
        return "status-overdue";
      default:
        return "status-pending";
    }
  };

  const handleInvest = (invoiceId: string) => {
    alert(
      `Investment in invoice ${invoiceId} initiated! (Mock implementation)`
    );
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏪 Open Invoices Marketplace
          </h1>
          <p className="text-gray-600">
            Browse and invest in available invoice opportunities
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search invoices by title or business name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="funded">Funded</option>
              </select>

              <select
                value={filters.riskLevel}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, riskLevel: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk</option>
                <option value="A">Risk A</option>
                <option value="B">Risk B</option>
                <option value="C">Risk C</option>
                <option value="D">Risk D</option>
              </select>

              <select
                value={filters.amountRange}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRange: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Amounts</option>
                <option value="0-1000">$0 - $1K</option>
                <option value="1000-5000">$1K - $5K</option>
                <option value="5000-10000">$5K - $10K</option>
                <option value="10000+">$10K+</option>
              </select>

              <select
                value={filters.daysUntilDue}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    daysUntilDue: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Due Dates</option>
                <option value="0-30">&lt; 30 days</option>
                <option value="30-60">30-60 days</option>
                <option value="60-90">60-90 days</option>
                <option value="90+">90+ days</option>
              </select>

              <select
                value={filters.currency}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Currency</option>
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
              </select>

              <select
                value={filters.industry}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, industry: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Industries</option>
                <option value="tech">Technology</option>
                <option value="consulting">Consulting</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredInvoices.length} of {SAMPLE_INVOICES.length}{" "}
            invoices
          </p>
        </div>

        {/* Invoice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {invoice.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {invoice.creator_info.business_name} -{" "}
                    {invoice.creator_info.location}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(
                      invoice.risk_assessment.risk_score
                    )}`}
                  >
                    Risk {invoice.risk_assessment.risk_score}
                  </span>
                  <span className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </span>
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Invoice Amount:</span>
                  <span className="font-semibold text-gray-900">
                    ${invoice.invoice_details.amount.toLocaleString()}{" "}
                    {invoice.invoice_details.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Offer Amount:</span>
                  <span className="font-semibold text-emerald-600">
                    ${invoice.financial_terms.offer_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected Yield:</span>
                  <span className="font-semibold text-purple-600">
                    {invoice.financial_terms.expected_yield}% APR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(
                      invoice.invoice_details.due_date
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {invoice.invoice_details.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {invoice.invoice_details.currency}
                </span>
                {invoice.risk_assessment.esg_compliant && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    ESG
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  Trust: {invoice.creator_info.trust_score}/100
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {invoice.status === "open" ? (
                  <button
                    onClick={() => handleInvest(invoice.id)}
                    className="w-full btn-primary"
                  >
                    💰 Invest Now
                  </button>
                ) : invoice.status === "funded" ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                  >
                    Already Funded
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                  >
                    Not Available
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({
                  status: "all",
                  riskLevel: "all",
                  amountRange: "all",
                  daysUntilDue: "all",
                  currency: "all",
                  industry: "all",
                });
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
