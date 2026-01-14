import { FileText, Image as ImageIcon, File, Download } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  url?: string;
  preview?: string; // For image thumbnails
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  className?: string;
  layout?: 'inline' | 'grid';
}

export function AttachmentPreview({ 
  attachments, 
  className = '',
  layout = 'inline'
}: AttachmentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const getIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-[#DC2626]" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-[#4F46E5]" />;
      case 'doc':
        return <File className="w-5 h-5 text-[#2563EB]" />;
      default:
        return <File className="w-5 h-5 text-[#6B7280]" />;
    }
  };

  const handleAttachmentClick = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setPreviewOpen(true);
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className={className}>
        <div className={
          layout === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
            : "space-y-2"
        }>
          {attachments.map((attachment) => (
            <button
              key={attachment.id}
              onClick={() => handleAttachmentClick(attachment)}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:border-[#4F46E5] hover:bg-[#F9FAFB] transition-all group w-full text-left"
            >
              {attachment.type === 'image' && attachment.preview ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#E5E7EB]">
                  <img 
                    src={attachment.preview} 
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center flex-shrink-0 border border-[#E5E7EB]">
                  {getIcon(attachment.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#0F172A] font-medium truncate">
                  {attachment.name}
                </div>
                <div className="text-[12px] text-[#6B7280]">
                  {attachment.size}
                </div>
              </div>
              <Download className="w-4 h-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto animate-in fade-in-0 zoom-in-98 duration-200">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] flex items-center gap-3">
              {selectedAttachment && getIcon(selectedAttachment.type)}
              {selectedAttachment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedAttachment?.type === 'image' && selectedAttachment.url && (
              <img
                src={selectedAttachment.url}
                alt={selectedAttachment.name}
                className="w-full rounded-lg border border-[#E5E7EB]"
              />
            )}
            {selectedAttachment?.type === 'pdf' && (
              <div className="bg-[#F9FAFB] rounded-lg p-12 text-center border border-[#E5E7EB]">
                <FileText className="w-16 h-16 mx-auto mb-4 text-[#DC2626]" />
                <p className="text-[14px] text-[#4B5563] mb-4">
                  PDF preview not available
                </p>
                <button className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-[14px] font-medium hover:bg-[#4338CA] transition-colors">
                  Download to view
                </button>
              </div>
            )}
            {selectedAttachment?.type === 'doc' && (
              <div className="bg-[#F9FAFB] rounded-lg p-12 text-center border border-[#E5E7EB]">
                <File className="w-16 h-16 mx-auto mb-4 text-[#2563EB]" />
                <p className="text-[14px] text-[#4B5563] mb-4">
                  Document preview not available
                </p>
                <button className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-[14px] font-medium hover:bg-[#4338CA] transition-colors">
                  Download to view
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
