"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#121A2B] border border-white/[0.08] rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 fade-in duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                variant === "danger" ? "bg-red-500/10 text-red-500" : "bg-[#3B82F6]/10 text-[#3B82F6]"
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <Dialog.Title className="font-poppins text-lg font-semibold text-[#E5ECF6]">
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.05] transition-all">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-[#94A3B8] font-manrope leading-relaxed mb-8">
            {description}
          </Dialog.Description>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="sv-btn-outline px-5 py-2 text-xs"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "px-5 py-2 rounded-lg text-xs font-manrope font-semibold transition-all disabled:opacity-50",
                variant === "danger" 
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" 
                  : "sv-btn-primary"
              )}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
