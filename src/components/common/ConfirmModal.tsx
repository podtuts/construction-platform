import React, { useEffect } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  errorMessage?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  errorMessage
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[#191C24] border border-[#2A2E38] rounded-[10px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Danger Accent */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2E38] bg-[#171A21]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-[#FC424A]/15 border border-[#FC424A]/30 flex items-center justify-center text-[#FC424A]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-semibold text-white tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-7 h-7 rounded flex items-center justify-center text-[#8D93A1] hover:text-white hover:bg-[#20232C] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-[#BAC2D1] leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="p-2.5 rounded-[6px] bg-[#20232C] border border-[#2A2E38] text-xs font-mono text-white break-all flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FC424A] shrink-0" />
              <span className="truncate font-semibold">{itemName}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-[6px] bg-[#FC424A]/15 border border-[#FC424A]/40 text-[#FC424A] text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-[11px] text-[#8D93A1]">
            This action cannot be undone and will permanently remove this record from the database.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end space-x-2.5 px-5 py-3.5 border-t border-[#2A2E38] bg-[#171A21]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-[#20232C] hover:bg-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs font-medium rounded-[4px] border border-[#2A2E38] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
            }}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-[#FC424A] hover:bg-[#e03139] text-white text-xs font-medium rounded-[4px] shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
