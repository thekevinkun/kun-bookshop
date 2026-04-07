import { useEffect } from "react";

interface AdminModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  disableClose?: boolean;
}

const AdminModal = ({
  title,
  onClose,
  children,
  disableClose = false,
}: AdminModalProps) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-700/50 bg-[#1E293B] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-5">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              disabled={disableClose}
              className="text-slate-400 transition-colors hover:text-white"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="admin-modal-scroll max-h-[calc(90vh-81px)] overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
