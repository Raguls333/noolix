import { Toaster as Sonner } from "sonner";

export function Toast() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        className: "toast-container",
        duration: 4000,
        style: {
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          color: "#0F172A",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        classNames: {
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
        },
      }}
    />
  );
}

export { toast } from "sonner";
