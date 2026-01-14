import { Shield } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        {icon || <Shield className="w-8 h-8 text-slate-400" />}
      </div>
      <h3 className="text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
