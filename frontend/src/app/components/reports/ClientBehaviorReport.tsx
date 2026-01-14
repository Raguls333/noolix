import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "../ui/button";
import { clientBehaviorReport } from "../../../api/reports";
import { exportToPDF } from "../../utils/pdfExport";

type BehaviorItem = {
  clientId: string;
  clientName: string;
  totalCommitments: number;
  avgApprovalDays: number | null;
  avgAcceptanceDays: number | null;
  changeFrequency: number;
};

export function ClientBehaviorReport() {
  const [items, setItems] = useState<BehaviorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await clientBehaviorReport();
        if (cancelled) return;
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load client behavior report.");
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const avgApproval = useMemo(() => {
    const values = items.map((i) => i.avgApprovalDays).filter((v): v is number => typeof v === "number");
    if (!values.length) return "N/A";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }, [items]);

  const avgAcceptance = useMemo(() => {
    const values = items.map((i) => i.avgAcceptanceDays).filter((v): v is number => typeof v === "number");
    if (!values.length) return "N/A";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }, [items]);

  const handleExport = async () => {
    await exportToPDF("client-behavior", {
      title: "Client Behavior",
      generatedAt: new Date().toISOString(),
      generatedBy: "Current User",
      items,
    });
  };

  return (
    <div className="max-w-5xl">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-sm text-slate-600 mb-6">
          Loading client behavior...
        </div>
      )}

      {/* Summary Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-700" />
            <h3 className="text-slate-900">Average Approval Time</h3>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-4xl text-slate-900">{avgApproval}</div>
            <div className="text-slate-600 mb-2">days</div>
          </div>
          <div className="text-sm text-slate-500 mt-2">Based on recent approvals</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-700" />
            <h3 className="text-slate-900">Average Acceptance Time</h3>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-4xl text-slate-900">{avgAcceptance}</div>
            <div className="text-slate-600 mb-2">days</div>
          </div>
          <div className="text-sm text-slate-500 mt-2">Based on recent acceptances</div>
        </div>
      </div>
      )}

      {/* Client Performance Table */}
      {!isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h2 className="text-slate-900">Client Performance Metrics</h2>
          </div>
          <Button variant="outline" className="border-slate-300" onClick={handleExport}>
            Export Report
          </Button>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Client</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Total Commitments</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Avg Approval (days)</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Avg Acceptance (days)</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Change Frequency</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((row) => (
              <tr key={row.clientId} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-900">{row.clientName}</td>
                <td className="px-6 py-4 text-right text-slate-700">{row.totalCommitments}</td>
                <td className="px-6 py-4 text-right text-slate-700">{row.avgApprovalDays ?? "N/A"}</td>
                <td className="px-6 py-4 text-right text-slate-700">{row.avgAcceptanceDays ?? "N/A"}</td>
                <td className="px-6 py-4 text-right text-slate-700">{row.changeFrequency}%</td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-sm">
                    {row.changeFrequency >= 30 ? "Needs Attention" : row.changeFrequency >= 15 ? "Fair" : "Good"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <div className="mt-6 space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Change Frequency:</span> Percentage of commitments that required scope or term modifications after initial creation.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Insight:</span> Clients with high change frequency may benefit from more detailed initial scoping discussions to reduce back-and-forth.
          </p>
        </div>
      </div>
    </div>
  );
}
