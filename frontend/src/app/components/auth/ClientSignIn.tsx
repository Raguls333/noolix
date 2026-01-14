import { useState } from "react";
import { Shield, Mail, Lock } from "lucide-react";

interface ClientSignInProps {
  onSignIn: (email: string, accessCode: string) => void;
  onNavigateToSignIn?: () => void;
}

export function ClientSignIn({ onSignIn, onNavigateToSignIn }: ClientSignInProps) {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      onSignIn(email, accessCode);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[28px] font-semibold text-[#0F172A] mb-2">
            Client Portal
          </h1>
          <p className="text-[15px] text-[#6B7280]">
            Access your commitments and deliverables
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[14px] font-medium text-[#374151] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="client@company.com"
                  required
                />
              </div>
            </div>

            {/* Access Code */}
            <div>
              <label className="block text-[14px] font-medium text-[#374151] mb-2">
                Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="Enter your access code"
                  required
                />
              </div>
              <p className="text-[13px] text-[#6B7280] mt-2">
                Your unique access code was sent to your email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] text-white py-3 rounded-lg font-medium hover:bg-[#4338CA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Signing in...' : 'Access Portal'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <p className="text-[13px] text-[#6B7280] text-center">
              Need help? Contact your project team for assistance.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-[#F0FDF5] border border-[#DCFCE8] rounded-xl p-4">
          <p className="text-[13px] text-[#065F46] text-center">
            🔒 Secure connection. All data is encrypted and protected.
          </p>
        </div>
      </div>
    </div>
  );
}