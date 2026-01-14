import { useState } from "react";
import { Building2, Mail, Phone, MapPin, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createClient } from "../../../api/clients"; // adjust path if needed

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (createdClient: any) => void; // optional callback after success
}

export interface ClientFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
}

export function AddClientModal({ open, onOpenChange, onCreated }: AddClientModalProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.contactName.trim()) newErrors.contactName = "Contact name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      notes: "",
    });
    setErrors({});
    setServerError("");
  };

  const handleSubmit = async () => {
    setServerError("");
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Map UI -> backend fields
      const payload = {
        companyName: formData.companyName.trim(),
        name: formData.contactName.trim(), // backend expects name
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
      };

      const created = await createClient(payload);

      // Optional: let parent refresh list
      onCreated?.(created);

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      // Your backend likely returns { ok:false, code, message }
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to create client. Please try again.";

      // Handle duplicate email nicely if backend exposes it
      if (
        (err?.response?.data?.code === "DUPLICATE" ||
          err?.response?.data?.message?.toLowerCase()?.includes("duplicate") ||
          err?.response?.data?.message?.toLowerCase()?.includes("already exists"))
      ) {
        setErrors((prev) => ({ ...prev, email: "This email already exists for this org" }));
      } else {
        setServerError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Create a new client record in your system</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {serverError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {serverError}
            </div>
          ) : null}

          {/* Company Information */}
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-[#0F172A] mb-2">
                  Company Name <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className={`h-11 ${errors.companyName ? "border-[#DC2626] focus:ring-[#DC2626]" : ""}`}
                />
                {errors.companyName && <p className="text-[13px] text-[#DC2626] mt-1">{errors.companyName}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Primary Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium text-[#0F172A] mb-2">
                  Contact Name <span className="text-[#DC2626]">*</span>
                </label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => handleChange("contactName", e.target.value)}
                  placeholder="e.g., John Smith"
                  className={`h-11 ${errors.contactName ? "border-[#DC2626] focus:ring-[#DC2626]" : ""}`}
                />
                {errors.contactName && <p className="text-[13px] text-[#DC2626] mt-1">{errors.contactName}</p>}
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#0F172A] mb-2">
                  Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@acme.com"
                    className={`h-11 pl-10 ${errors.email ? "border-[#DC2626] focus:ring-[#DC2626]" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-[13px] text-[#DC2626] mt-1">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[14px] font-medium text-[#0F172A] mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address (UI only for now) */}
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address (Optional)
            </h3>
            {/* keep as-is */}
            <div className="space-y-4">
              <Input
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="123 Main Street"
                className="h-11"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Chennai"
                  className="h-11"
                />
                <Input
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="India"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[14px] font-medium text-[#0F172A] mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add any additional notes about this client..."
              rows={4}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#E5E7EB]">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
          >
            {isSaving ? "Adding..." : "Add Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
