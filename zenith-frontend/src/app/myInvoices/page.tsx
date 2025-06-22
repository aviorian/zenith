"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_INVOICES } from "@/lib/contract";

export default function MyInvoices() {
  const [selectedTab, setSelectedTab] = useState("all");

  // Mock user invoices - in reality, this would be filtered by user address
  const userInvoices = SAMPLE_INVOICES;

  const filteredInvoices =
    selectedTab === "all"
      ? userInvoices
      : userInvoices.filter((invoice) => invoice.status === selectedTab);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "open":
        return "🔵";
      case "funded":
        return "💰";
      case "completed":
        return "✅";
      case "overdue":
        return "⚠️";
      default:
        return "⏳";
    }
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
                href="/openInvoices"
                className="text-gray-600 hover:text-blue-600"
              >
                Open Invoices
              </Link>
              <Link href="/createInvoice" className="btn-primary">
                Create Invoice
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 My Invoices
          </h1>
          <p className="text-gray-600">
            Manage your tokenized invoices and track their status
          </p>
        </div>

        {/* Status Tabs */}
        <div className="card mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Invoices", count: userInvoices.length },
              {
                key: "pending",
                label: "Pending",
                count: userInvoices.filter((i) => i.status === "pending")
                  .length,
              },
              {
                key: "open",
                label: "Open",
                count: userInvoices.filter((i) => i.status === "open").length,
              },
              {
                key: "funded",
                label: "Funded",
                count: userInvoices.filter((i) => i.status === "funded").length,
              },
              {
                key: "completed",
                label: "Completed",
                count: userInvoices.filter((i) => i.status === "completed")
                  .length,
              },
              {
                key: "overdue",
                label: "Overdue",
                count: userInvoices.filter((i) => i.status === "overdue")
                  .length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <p className="text-sm text-gray-600">Total Invoice Value</p>
                <p className="text-xl font-bold text-gray-900">
                  $
                  {userInvoices
                    .reduce((sum, inv) => sum + inv.invoice_details.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💎</span>
              <div>
                <p className="text-sm text-gray-600">Total Funded</p>
                <p className="text-xl font-bold text-emerald-600">
                  $
                  {userInvoices
                    .filter(
                      (inv) =>
                        inv.status === "funded" || inv.status === "completed"
                    )
                    .reduce(
                      (sum, inv) => sum + inv.financial_terms.offer_amount,
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {userInvoices.length > 0
                    ? Math.round(
                        (userInvoices.filter(
                          (inv) => inv.status === "completed"
                        ).length /
                          userInvoices.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              <div>
                <p className="text-sm text-gray-600">Avg. Funding Time</p>
                <p className="text-xl font-bold text-purple-600">2.3 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Left side - Invoice details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xl">
                      {getStatusIcon(invoice.status)}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {invoice.title}
                    </h3>
                    <span className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Invoice Amount</p>
                      <p className="font-semibold text-gray-900">
                        ${invoice.invoice_details.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-semibold text-gray-900">
                        {invoice.invoice_details.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          invoice.invoice_details.due_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          invoice.timestamps.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {invoice.status === "funded" && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Funded Amount</p>
                        <p className="font-semibold text-emerald-600">
                          $
                          {invoice.financial_terms.offer_amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Funded Date</p>
                        <p className="font-semibold text-gray-900">
                          {invoice.timestamps.funded_at &&
                            new Date(
                              invoice.timestamps.funded_at
                            ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6">
                  <button className="btn-primary text-sm">View Details</button>

                  {invoice.status === "pending" && (
                    <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                      Edit Invoice
                    </button>
                  )}

                  {invoice.status === "open" && (
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Share Invoice
                    </button>
                  )}

                  {invoice.status === "funded" && (
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      Track Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedTab === "all"
                ? "No invoices yet"
                : `No ${selectedTab} invoices`}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedTab === "all"
                ? "Create your first invoice to get started with tokenized invoice financing"
                : `You don't have any ${selectedTab} invoices at the moment`}
            </p>
            <Link href="/createInvoice">
              <button className="btn-primary">Create Your First Invoice</button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
