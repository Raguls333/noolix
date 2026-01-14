import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-[13px] mb-4 lg:mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-[#6B7280] hover:text-[#0F172A] transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? 'text-[#0F172A] font-medium' : 'text-[#6B7280]'}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB]" />}
          </div>
        );
      })}
    </nav>
  );
}
