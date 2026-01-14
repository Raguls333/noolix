import { Download, ShieldCheck, Clock, Check, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface ProofViewProps {
  onBack: () => void;
}

export function ProofView({ onBack }: ProofViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to overview
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900 mb-1">Commitment Proof</h1>
              <p className="text-slate-600">
                Complete audit trail and verification record
              </p>
            </div>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export Proof
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <div className="text-green-900">Commitment Active & Verified</div>
              <div className="text-green-700 text-sm">
                All parties have approved. Timeline and deliverables are locked.
              </div>
            </div>
          </div>
        </div>

        {/* Commitment Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
          <h2 className="text-slate-900 mb-6">Commitment Details</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">Service Provider</div>
                <div className="text-slate-900">Digital Solutions Agency</div>
                <div className="text-slate-600">contact@digitalsolutions.com</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Client</div>
                <div className="text-slate-900">Acme Corp</div>
                <div className="text-slate-600">john@acmecorp.com</div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="text-sm text-slate-500 mb-2">Scope of Work</div>
              <div className="text-slate-900">
                Complete redesign of the company website including responsive layouts, custom animations, and CMS integration.
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">Amount</div>
                <div className="text-slate-900">$15,000</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Due Date</div>
                <div className="text-slate-900">January 15, 2025</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Status</div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  In Progress
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h2 className="text-slate-900 mb-6">Complete Audit Trail</h2>
          
          <div className="space-y-6">
            {/* Event 1 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 w-0.5 bg-slate-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="text-slate-900 mb-1">Commitment Approved</div>
                <div className="text-slate-600 text-sm mb-3">
                  Client approved all terms and conditions
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-slate-500">Approved by:</span>
                    <span className="text-slate-900 ml-2">john@acmecorp.com</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-900 ml-2">December 20, 2024 at 10:15:32 AM EST</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">IP Address:</span>
                    <span className="text-slate-900 ml-2">192.168.1.1</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Verification Hash:</span>
                    <span className="text-slate-900 ml-2 font-mono text-xs">a3f9c8e2d1b7f6a5c4e3d2b1a0f9e8d7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event 2 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 w-0.5 bg-slate-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="text-slate-900 mb-1">Approval Request Sent</div>
                <div className="text-slate-600 text-sm mb-3">
                  Email sent to client with approval link
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-slate-500">Sent to:</span>
                    <span className="text-slate-900 ml-2">john@acmecorp.com</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-900 ml-2">December 18, 2024 at 4:45:18 PM EST</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event 3 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-slate-900 mb-1">Commitment Created</div>
                <div className="text-slate-600 text-sm mb-3">
                  Initial commitment drafted by service provider
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-slate-500">Created by:</span>
                    <span className="text-slate-900 ml-2">contact@digitalsolutions.com</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-900 ml-2">December 18, 2024 at 4:45:00 PM EST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Notice */}
        <div className="mt-6 bg-slate-900 text-white rounded-lg p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <div className="mb-1">Cryptographically Verified</div>
              <p className="text-slate-300 text-sm">
                This commitment record is tamper-proof and can be independently verified. All timestamps are recorded in UTC and converted to local time for display. Each action is cryptographically signed and cannot be altered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
