import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Upload,
  Plus,
  X,
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";

// ✅ API (matches your backend routes)
import { listClients, type Client as ApiClient } from "../../../api/clients";
import { createCommitment, sendApprovalLink } from "../../../api/commitments";

// ✅ Uploads API (generic reusable /api/uploads)
import {
  uploadAttachments,
  deleteAttachment,
  type Attachment,
} from "../../../api/uploads";

interface CreateCommitmentWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

interface Deliverable {
  id: string;
  text: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
}

interface PaymentTerm {
  id: string;
  text: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
}

interface Milestone {
  id: string;
  text: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
}

interface ExistingClient {
  id: string;
  name: string;
  email: string;
}

const existingClients: ExistingClient[] = [
  { id: "1", name: "Acme Corp", email: "contact@acmecorp.com" },
  { id: "2", name: "TechStart Inc", email: "info@techstart.com" },
  { id: "3", name: "Global Solutions", email: "hello@globalsolutions.com" },
  { id: "4", name: "Retail Plus", email: "team@retailplus.com" },
  { id: "5", name: "Finance Co", email: "contact@financeco.com" },
  { id: "6", name: "Marketing Hub", email: "info@marketinghub.com" },
  { id: "7", name: "Design Studio", email: "hello@designstudio.com" },
  { id: "8", name: "Enterprise Systems", email: "contact@enterprisesystems.com" },
];

export function CreateCommitmentWizard({
  onBack,
  onComplete,
}: CreateCommitmentWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    title: "",
    scope: "",
    deliverables: [] as Deliverable[],
    amount: "",
    currency: "USD",
    paymentTerms: [] as PaymentTerm[],
    milestone: [] as Milestone[],
    whoApproves: "client",
    reApprovalOnChanges: true,
    acceptanceRequired: true,
  });
  const [newDeliverableText, setNewDeliverableText] = useState("");
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const [newPaymentTermText, setNewPaymentTermText] = useState("");
  const [isAddingPaymentTerm, setIsAddingPaymentTerm] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  // ✅ Upload state (API-backed)
const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ NEW: API-backed clients list (falls back to mock)
  const [clients, setClients] = useState<ExistingClient[]>(existingClients);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // ✅ NEW: create commitment submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (
    field: string,
    value: string | boolean | Deliverable[] | PaymentTerm[] | Milestone[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Load clients from API
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingClients(true);
      try {
        const res = await listClients({ page: 1, limit: 500 });
        if (cancelled) return;

        const mapped: ExistingClient[] = (res?.clients || []).map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
          email: c.email,
        }));

        if (mapped.length > 0) {
          setClients(mapped);
        } else {
          setClients(existingClients);
        }
      } catch {
        if (!cancelled) setClients(existingClients);
      } finally {
        if (!cancelled) setIsLoadingClients(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClientSelection = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      updateField("clientName", client.name);
      updateField("clientEmail", client.email);
    } else {
      updateField("clientName", "");
      updateField("clientEmail", "");
    }
  };

  const addDeliverable = () => {
    if (newDeliverableText.trim()) {
      const newDeliverable: Deliverable = {
        id: Date.now().toString(),
        text: newDeliverableText.trim(),
        status: "NOT_STARTED",
      };
      updateField("deliverables", [...formData.deliverables, newDeliverable]);
      setNewDeliverableText("");
      setIsAddingDeliverable(false);
    }
  };

  const updateDeliverable = (id: string, updates: Partial<Deliverable>) => {
    updateField(
      "deliverables",
      formData.deliverables.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const removeDeliverable = (id: string) => {
    updateField(
      "deliverables",
      formData.deliverables.filter((d) => d.id !== id)
    );
  };

  const addPaymentTerm = () => {
    if (newPaymentTermText.trim()) {
      const newPaymentTerm: PaymentTerm = {
        id: Date.now().toString(),
        text: newPaymentTermText.trim(),
        status: "PENDING",
      };
      updateField("paymentTerms", [...formData.paymentTerms, newPaymentTerm]);
      setNewPaymentTermText("");
      setIsAddingPaymentTerm(false);
    }
  };

  const updatePaymentTerm = (id: string, updates: Partial<PaymentTerm>) => {
    updateField(
      "paymentTerms",
      formData.paymentTerms.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const removePaymentTerm = (id: string) => {
    updateField(
      "paymentTerms",
      formData.paymentTerms.filter((p) => p.id !== id)
    );
  };

  const addMilestone = () => {
    if (newMilestoneText.trim()) {
      const newMilestone: Milestone = {
        id: Date.now().toString(),
        text: newMilestoneText.trim(),
        status: "NOT_STARTED",
      };
      updateField("milestone", [...formData.milestone, newMilestone]);
      setNewMilestoneText("");
      setIsAddingMilestone(false);
    }
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    updateField(
      "milestone",
      formData.milestone.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const removeMilestone = (id: string) => {
    updateField(
      "milestone",
      // @ts-ignore
      formData.milestone.filter((m) => m.id !== id)
    );
  };

  const getStatusIcon = (status: Deliverable["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "IN_PROGRESS":
        return <Loader2 className="w-4 h-4 text-blue-600" />;
      case "BLOCKED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPaymentStatusIcon = (status: PaymentTerm["status"]) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "OVERDUE":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "CANCELLED":
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const steps = [
    { number: 1, label: "Basics" },
    { number: 2, label: "Scope & Deliverables" },
    { number: 3, label: "Commercial Terms" },
    { number: 4, label: "Approval Rules" },
    { number: 5, label: "Review & Send" },
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.clientName && formData.clientEmail && formData.title;
      case 2:
        return formData.scope;
      case 3:
        return formData.amount && formData.paymentTerms.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  // ✅ Upload helpers (calls /api/uploads and stores returned attachments list)
  const filterAllowedFiles = (files: File[]) =>
    files.filter((file) =>
      file.type.match(
        "application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|image/*"
      )
    );

const uploadSelectedFiles = async (files: File[]) => {
  if (!files.length) return;

  setUploadError(null);
  setIsUploading(true);

  try {
    const res = await uploadAttachments(files);

    const newAttachments = res?.items ?? [];

    setUploadedFiles((prev) => [...prev, ...files]);
    setAttachments((prev) => [...prev, ...newAttachments]);
  } catch (e: any) {
    setUploadError(typeof e?.message === "string" ? e.message : "Upload failed. Please try again.");
  } finally {
    setIsUploading(false);
  }
};


  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    const newFiles = filterAllowedFiles(files);
    await uploadSelectedFiles(newFiles);
  };

  const handleFileDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleFileDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = filterAllowedFiles(files);
    await uploadSelectedFiles(newFiles);

    // allow re-select same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

const handleFileRemove = async (index: number) => {
  const att = attachments[index];

  setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  setAttachments((prev) => prev.filter((_, i) => i !== index));

  if (att?.publicId) {
    try {
      await deleteAttachment(att.publicId);
    } catch {
      // non-blocking
    }
  }
};


  // ✅ Create commitment in backend + send approval link
  const handleSubmit = async () => {
    setSubmitError(null);

    if (!selectedClientId) {
      setSubmitError("Please select a client.");
      return;
    }
    if (!formData.title || !formData.scope) {
      setSubmitError("Please fill all required fields.");
      return;
    }

    const amountNum =
      formData.amount === "" || formData.amount === null || formData.amount === undefined
        ? undefined
        : Number(formData.amount);

    if (amountNum !== undefined && (!Number.isFinite(amountNum) || amountNum < 0)) {
      setSubmitError("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Map UI -> backend
      // Keep backward compatibility with your current backend (title + scopeText + amount + currency + attachments)
      const created: any = await createCommitment({
        clientId: selectedClientId,
        title: formData.title,
        scopeText: formData.scope,
        amount: amountNum,
        currency: formData.currency || "USD",
        // Send the real uploaded attachment references (publicId/url etc.)
        // Your backend should store these; if it currently stores string[], adapt in backend or map to url/publicId.
        attachments,
        // If your backend supports these fields, keep them; otherwise it will ignore.
        deliverables: formData.deliverables.map((d) => ({ text: d.text, status: d.status })),
        paymentTerms: formData.paymentTerms.map((p) => ({ text: p.text, status: p.status })),
        milestones: formData.milestone.map((m) => ({ text: m.text, status: m.status })),
        approvalRules: {
          whoApproves: formData.whoApproves,
          reApprovalOnChanges: formData.reApprovalOnChanges,
          acceptanceRequired: formData.acceptanceRequired,
        },
      } as any);

      if (created?._id) {
        await sendApprovalLink(created._id);
      }

      onComplete();
    } catch (e: any) {
      const msg =
        typeof e?.message === "string"
          ? e.message
          : "Failed to create commitment. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to dashboard
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-slate-900 mb-2">Create New Commitment</h1>
          <p className="text-slate-600">Define the agreement clearly to ensure mutual understanding</p>
        </div>

        {/* Progress */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm ${
                      step > s.number
                        ? "bg-slate-900 border-slate-900 text-white"
                        : step === s.number
                        ? "border-slate-900 text-slate-900"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span
                    className={`text-sm hidden md:inline ${
                      step >= s.number ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${step > s.number ? "bg-slate-900" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-slate-900 mb-1">Basic Information</h2>
                <p className="text-slate-600 text-sm mb-6">This identifies the agreement</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Client Name</Label>
                    <select
                      id="clientName"
                      value={selectedClientId}
                      onChange={(e) => handleClientSelection(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                    >
                      <option value="">{isLoadingClients ? "Loading clients..." : "Select a client"}</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => updateField("clientEmail", e.target.value)}
                      placeholder="client@company.com"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Approval link will be sent to this email</p>
                  </div>
                  <div>
                    <Label htmlFor="title">Commitment Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g., Website Redesign Phase 1"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Scope & Deliverables */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-slate-900 mb-1">Scope & Deliverables</h2>
                <p className="text-slate-600 text-sm mb-6">This will be locked after approval</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scope">Scope Description</Label>
                    <Textarea
                      id="scope"
                      value={formData.scope}
                      onChange={(e) => updateField("scope", e.target.value)}
                      placeholder="Describe the work to be completed in clear terms"
                      rows={6}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Deliverables</Label>
                    <div className="mt-1.5 space-y-3">
                      {/* Existing Deliverables */}
                      {formData.deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-slate-900">{deliverable.text}</div>
                          </div>

                          {/* Status Dropdown */}
                          <select
                            value={deliverable.status}
                            onChange={(e) =>
                              updateDeliverable(deliverable.id, {
                                status: e.target.value as Deliverable["status"],
                              })
                            }
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                          >
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>

                          {/* Status Icon */}
                          <div className="flex-shrink-0">{getStatusIcon(deliverable.status)}</div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeDeliverable(deliverable.id)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* Add New Deliverable Input */}
                      {isAddingDeliverable ? (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-slate-300 rounded-lg">
                          <Input
                            value={newDeliverableText}
                            onChange={(e) => setNewDeliverableText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addDeliverable();
                              } else if (e.key === "Escape") {
                                setNewDeliverableText("");
                                setIsAddingDeliverable(false);
                              }
                            }}
                            placeholder="Enter deliverable description"
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            onClick={addDeliverable}
                            disabled={!newDeliverableText.trim()}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                            size="sm"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setNewDeliverableText("");
                              setIsAddingDeliverable(false);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setIsAddingDeliverable(true)}
                          variant="outline"
                          className="w-full border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Deliverable
                        </Button>
                      )}

                      <p className="text-xs text-slate-500">
                        Press Enter to add, Escape to cancel. Each deliverable can be tracked with its own status.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>File Attachment</Label>
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                    />

                    {/* Upload drop zone */}
                    <div
                      className={`mt-1.5 border-2 rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? "border-[#4F46E5] bg-[#EEF2FF]"
                          : "border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleFileDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragEnter={handleFileDragEnter}
                      onDragLeave={handleFileDragLeave}
                    >
                      <Upload
                        className={`w-6 h-6 mx-auto mb-2 ${
                          isDragging ? "text-[#4F46E5]" : "text-slate-400"
                        }`}
                      />
                      <p className={`text-sm ${isDragging ? "text-[#4F46E5] font-medium" : "text-slate-600"}`}>
                        {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, or image files up to 10MB</p>
                      {isUploading && (
                        <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{uploadError}</p>
                      </div>
                    )}

                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                          >
                            <FileText className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-900 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                              {attachments[index]?.url && (
                                <a
                                  href={attachments[index].url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[#4F46E5] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View
                                </a>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileRemove(index);
                              }}
                              className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Remove file"
                              disabled={isUploading || isSubmitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Step 3: Commercial Terms */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-slate-900 mb-1">Commercial Terms</h2>
                <p className="text-slate-600 text-sm mb-6">Define the financial agreement</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => updateField("amount", e.target.value)}
                        placeholder="15000"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => updateField("currency", e.target.value)}
                        className="mt-1.5"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Payment Terms</Label>
                    <div className="mt-1.5 space-y-3">
                      {formData.paymentTerms.map((paymentTerm) => (
                        <div
                          key={paymentTerm.id}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-slate-900">{paymentTerm.text}</div>
                          </div>

                          <select
                            value={paymentTerm.status}
                            onChange={(e) =>
                              updatePaymentTerm(paymentTerm.id, {
                                status: e.target.value as PaymentTerm["status"],
                              })
                            }
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <div className="flex-shrink-0">{getPaymentStatusIcon(paymentTerm.status)}</div>

                          <button
                            onClick={() => removePaymentTerm(paymentTerm.id)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {isAddingPaymentTerm ? (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-slate-300 rounded-lg">
                          <Input
                            value={newPaymentTermText}
                            onChange={(e) => setNewPaymentTermText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addPaymentTerm();
                              } else if (e.key === "Escape") {
                                setNewPaymentTermText("");
                                setIsAddingPaymentTerm(false);
                              }
                            }}
                            placeholder="Enter payment term description"
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            onClick={addPaymentTerm}
                            disabled={!newPaymentTermText.trim()}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                            size="sm"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setNewPaymentTermText("");
                              setIsAddingPaymentTerm(false);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setIsAddingPaymentTerm(true)}
                          variant="outline"
                          className="w-full border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Payment Term
                        </Button>
                      )}

                      <p className="text-xs text-slate-500">
                        Press Enter to add, Escape to cancel. Each payment term can be tracked with its own status.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Milestones (optional)</Label>
                    <div className="mt-1.5 space-y-3">
                      {formData.milestone.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-slate-900">{milestone.text}</div>
                          </div>

                          <select
                            value={milestone.status}
                            onChange={(e) =>
                              updateMilestone(milestone.id, {
                                status: e.target.value as Milestone["status"],
                              })
                            }
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                          >
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>

                          <div className="flex-shrink-0">{getStatusIcon(milestone.status)}</div>

                          <button
                            onClick={() => removeMilestone(milestone.id)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {isAddingMilestone ? (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-slate-300 rounded-lg">
                          <Input
                            value={newMilestoneText}
                            onChange={(e) => setNewMilestoneText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addMilestone();
                              } else if (e.key === "Escape") {
                                setNewMilestoneText("");
                                setIsAddingMilestone(false);
                              }
                            }}
                            placeholder="Enter milestone description"
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            onClick={addMilestone}
                            disabled={!newMilestoneText.trim()}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                            size="sm"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setNewMilestoneText("");
                              setIsAddingMilestone(false);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setIsAddingMilestone(true)}
                          variant="outline"
                          className="w-full border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Milestone
                        </Button>
                      )}

                      <p className="text-xs text-slate-500">
                        Press Enter to add, Escape to cancel. Each milestone can be tracked with its own status.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Step 4: Approval Rules */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-slate-900 mb-1">Approval Rules</h2>
                <p className="text-slate-600 text-sm mb-6">Define how changes and acceptance work</p>
                <div className="space-y-6">
                  <div>
                    <Label>Who Approves</Label>
                    <div className="mt-3 space-y-3">
                      <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300">
                        <input
                          type="radio"
                          name="whoApproves"
                          value="client"
                          checked={formData.whoApproves === "client"}
                          onChange={(e) => updateField("whoApproves", e.target.value)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="text-slate-900">Client only</div>
                          <div className="text-xs text-slate-600">Client must approve the commitment</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300">
                        <input
                          type="radio"
                          name="whoApproves"
                          value="both"
                          checked={formData.whoApproves === "both"}
                          onChange={(e) => updateField("whoApproves", e.target.value)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="text-slate-900">Both parties</div>
                          <div className="text-xs text-slate-600">Both you and client must approve</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <div className="text-slate-900 mb-1">Re-approval on changes</div>
                      <div className="text-sm text-slate-600">Any changes to scope or terms require re-approval</div>
                    </div>
                    <Switch
                      checked={formData.reApprovalOnChanges}
                      onCheckedChange={(checked) => updateField("reApprovalOnChanges", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <div className="text-slate-900 mb-1">Acceptance required</div>
                      <div className="text-sm text-slate-600">
                        Client must explicitly accept deliverables when complete
                      </div>
                    </div>
                    <Switch
                      checked={formData.acceptanceRequired}
                      onCheckedChange={(checked) => updateField("acceptanceRequired", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Send */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-slate-900 mb-1">Review & Send</h2>
                <p className="text-slate-600 text-sm mb-6">Verify all details before sending</p>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                <div className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Client</div>
                  <div className="text-slate-900">{formData.clientName}</div>
                  <div className="text-sm text-slate-600">{formData.clientEmail}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Commitment</div>
                  <div className="text-slate-900">{formData.title}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Scope</div>
                  <div className="text-slate-900 whitespace-pre-wrap">{formData.scope}</div>
                </div>
                {formData.deliverables.length > 0 && (
                  <div className="p-4">
                    <div className="text-xs text-slate-500 mb-1">Deliverables</div>
                    <div className="text-slate-900 whitespace-pre-wrap">
                      {formData.deliverables.map((d) => (
                        <div key={d.id} className="flex items-center gap-2">
                          {getStatusIcon(d.status)}
                          <span className="text-sm text-slate-900">{d.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="p-4">
                    <div className="text-xs text-slate-500 mb-2">File Attachments</div>
                    <div className="space-y-2">
                      {attachments.map((att, index) => (
                        <div
                          key={att.publicId || att.url || String(index)}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <FileText className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 truncate">
                              {uploadedFiles[index]?.name ?? att.url ?? att.publicId ?? "Attachment"}
                            </p>
                            {att.url && (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#4F46E5] hover:underline"
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Amount</div>
                  <div className="text-slate-900">
                    ${Number(formData.amount).toLocaleString()} {formData.currency}
                  </div>
                </div>
                {formData.paymentTerms.length > 0 && (
                  <div className="p-4">
                    <div className="text-xs text-slate-500 mb-1">Payment Terms</div>
                    <div className="text-slate-900 whitespace-pre-wrap">
                      {formData.paymentTerms.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          {getPaymentStatusIcon(p.status)}
                          <span className="text-sm text-slate-900">{p.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {formData.milestone.length > 0 && (
                  <div className="p-4">
                    <div className="text-xs text-slate-500 mb-1">Milestones</div>
                    <div className="text-slate-900 whitespace-pre-wrap">
                      {formData.milestone.map((m) => (
                        <div key={m.id} className="flex items-center gap-2">
                          {getStatusIcon(m.status)}
                          <span className="text-sm text-slate-900">{m.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Approval Rules</div>
                  <div className="text-sm text-slate-700 space-y-1">
                    <div>• Approver: {formData.whoApproves === "client" ? "Client only" : "Both parties"}</div>
                    <div>• Re-approval on changes: {formData.reApprovalOnChanges ? "Yes" : "No"}</div>
                    <div>• Acceptance required: {formData.acceptanceRequired ? "Yes" : "No"}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  An approval email will be sent to <span className="font-medium">{formData.clientEmail}</span>. The
                  commitment becomes active only after approval.
                </p>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || isSubmitting}
              className="text-slate-600"
            >
              Previous
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed() || isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSubmitting ? "Sending..." : isUploading ? "Uploading..." : "Send for Approval"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
