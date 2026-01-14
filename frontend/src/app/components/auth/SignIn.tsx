import { useState } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SignInProps {
  onSignIn: (email: string, password: string) => void;
  onNavigateToSignUp: () => void;
}

export function SignIn({ onSignIn, onNavigateToSignUp }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-lg mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2">Sign In</h1>
          <p className="text-slate-600">
            Access your commitment management system
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-600">
                This activity is logged and timestamped for security and audit purposes.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onNavigateToSignUp}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Don't have an account? <span className="underline">Sign up</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Detected timezone: {timezone}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-700">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-700">Security</a>
          </div>
        </div>
      </div>
    </div>
  );
}
