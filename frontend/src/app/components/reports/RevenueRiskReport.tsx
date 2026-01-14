import { CircleAlert, TrendingDown, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function RevenueRiskReport() {
  return (
    <div className="max-w-5xl">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Date Range</Label>
            <div className="flex gap-2 mt-1.5">
              <Input type="date" className="flex-1" />
              <span className="flex items-center text-slate-400">to</span>
              <Input type="date" className="flex-1" />
            </div>
          </div>
          <div>
            <Label>Client</Label>
            <Input placeholder="All clients" className="mt-1.5" />
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-slate-900 text-white">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-slate-600">Pending Approvals</div>
          </div>
          <div className="text-3xl text-slate-900 mb-1">$43,000</div>
          <div className="text-xs text-slate-600">3 commitments</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <div className="text-sm text-slate-600">Awaiting Acceptance</div>
          </div>
          <div className="text-3xl text-slate-900 mb-1">$27,000</div>
          <div className="text-xs text-slate-600">2 commitments</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <CircleAlert className="w-5 h-5 text-red-600" />
            <div className="text-sm text-slate-600">Overdue / Disputed</div>
          </div>
          <div className="text-3xl text-slate-900 mb-1">$35,000</div>
          <div className="text-xs text-slate-600">1 commitment</div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-slate-900">At-Risk Commitments</h2>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Client</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Commitment</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Status</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Amount</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Risk Factor</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="hover:bg-slate-50">
              <td className="px-6 py-4 text-slate-900">Retail Plus</td>
              <td className="px-6 py-4 text-slate-700">E-commerce Migration</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-red-800 text-sm">
                  Overdue
                </span>
              </td>
              <td className="px-6 py-4 text-right text-slate-900">$35,000</td>
              <td className="px-6 py-4 text-red-700 text-sm">Payment overdue</td>
              <td className="px-6 py-4 text-right text-slate-600">12 days</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-6 py-4 text-slate-900">TechStart Inc</td>
              <td className="px-6 py-4 text-slate-700">Mobile App Development</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                  Pending
                </span>
              </td>
              <td className="px-6 py-4 text-right text-slate-900">$28,000</td>
              <td className="px-6 py-4 text-amber-700 text-sm">Awaiting approval 8+ days</td>
              <td className="px-6 py-4 text-right text-slate-600">8 days</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-6 py-4 text-slate-900">Global Solutions</td>
              <td className="px-6 py-4 text-slate-700">API Integration</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-200 bg-purple-50 text-purple-800 text-sm">
                  Awaiting Acceptance
                </span>
              </td>
              <td className="px-6 py-4 text-right text-slate-900">$12,000</td>
              <td className="px-6 py-4 text-amber-700 text-sm">Deliverables not accepted</td>
              <td className="px-6 py-4 text-right text-slate-600">5 days</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" className="border-slate-300">
          Export Report as PDF
        </Button>
      </div>
    </div>
  );
}