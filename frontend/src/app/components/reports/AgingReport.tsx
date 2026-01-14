import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "../ui/button";
import { DateRangePicker } from "../shared/DateRangePicker";
import { ClientSelector } from "../shared/ClientSelector";
import { agingReport } from "../../../api/reports";
import { exportToPDF } from "../../utils/pdfExport";
import type { Commitment as ApiCommitment } from "../../../api/commitments";

type AgingItem = {
  id: string;
  clientId: string | null;
  client: string;
  commitment: string;
  status: string;
  amount: number;
  createdDate: string;
  age: number;
  bucket: "0-7" | "8-30" | "30+";
};

function formatMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return "N/A";
  const cur = currency || "INR";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${cur}`;
  }
}

function formatShortDate(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function AgingReport() {
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [items, setItems] = useState<AgingItem[]>([]);
  const [buckets, setBuckets] = useState<Record<string, { count: number; totalAmount: number }>>({
    "0-7": { count: 0, totalAmount: 0 },
    "8-30": { count: 0, totalAmount: 0 },
    "30+": { count: 0, totalAmount: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange.from ? dateRange.from.toISOString() : undefined;
        const to = dateRange.to ? dateRange.to.toISOString() : undefined;
        const clientId = selectedClients.length === 1 ? selectedClients[0] : undefined;
        const res = await agingReport({ from, to, clientId });
        if (cancelled) return;
        const rawItems = Array.isArray(res?.items) ? res.items : [];
        const mapped = rawItems.map((item: ApiCommitment & { ageDays?: number; bucket?: string }) => ({
          id: String(item._id || ""),
          clientId:
            typeof item?.clientId === "string"
              ? item.clientId
              : item?.clientId?._id
              ? String(item.clientId._id)
              : null,
          client: item?.clientName || item?.clientId?.name || item?.clientSnapshot?.name || "Unknown",
          commitment: item.title || "Untitled",
          status: item.status,
          amount: typeof item.amount === "number" ? item.amount : 0,
          createdDate: formatShortDate(item.createdAt),
          age: typeof item.ageDays === "number" ? item.ageDays : 0,
          bucket: (item.bucket || "0-7") as AgingItem["bucket"],
        }));
        const filtered =
          selectedClients.length > 0
            ? mapped.filter((item) => item.clientId && selectedClients.includes(item.clientId))
            : mapped;
        setItems(filtered);
        setBuckets(res?.buckets || { "0-7": { count: 0, totalAmount: 0 }, "8-30": { count: 0, totalAmount: 0 }, "30+": { count: 0, totalAmount: 0 } });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load aging report.");
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateRange.from, dateRange.to, selectedClients]);

  const handleExport = async () => {
    await exportToPDF("aging-report", {
      title: "Commitment Aging",
      generatedAt: new Date().toISOString(),
      generatedBy: "Current User",
      items: items.map((item) => ({
        client: item.client,
        commitment: item.commitment,
        status: item.status,
        amount: item.amount,
        age: item.age,
        bucket: item.bucket,
      })),
      buckets,
    });
  };

  const summaryItems = useMemo(
    () => [
      { label: "0-7 Days", data: buckets["0-7"], tone: "text-green-700" },
      { label: "8-30 Days", data: buckets["8-30"], tone: "text-amber-700" },
      { label: "30+ Days", data: buckets["30+"], tone: "text-red-700" },
    ],
    [buckets]
  );

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} className="flex-1 sm:max-w-xs" />
        <ClientSelector
          value={selectedClients}
          onChange={setSelectedClients}
          multiSelect
          placeholder="All clients"
          className="flex-1 sm:max-w-xs"
        />
        <Button variant="outline" className="border-slate-300 h-11" onClick={handleExport}>
          Export Report
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-sm text-slate-600">
          Loading aging report...
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {summaryItems.map((bucket) => (
            <div key={bucket.label} className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="text-sm text-slate-600 mb-2">{bucket.label}</div>
              <div className="text-3xl text-slate-900 mb-1">{bucket.data.count}</div>
              <div className={`text-sm ${bucket.tone}`}>{formatMoney(bucket.data.totalAmount, "INR")} total</div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Table */}
      {!isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <h2 className="text-slate-900">Commitment Aging Details</h2>
          </div>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Client</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Commitment</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Stage</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Amount</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Age (days)</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Bucket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-900">{row.client}</td>
                <td className="px-6 py-4 text-slate-700">{row.commitment}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{row.status}</td>
                <td className="px-6 py-4 text-right text-slate-900">{formatMoney(row.amount, "INR")}</td>
                <td className="px-6 py-4 text-right text-slate-700">{row.age}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-sm">
                    {row.bucket} days
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Definition:</span> Aging is calculated from commitment creation date to current date. Commitments older than 30 days require immediate attention.
        </p>
      </div>
    </div>
  );
}
