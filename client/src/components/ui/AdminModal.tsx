import * as Dialog from "@radix-ui/react-dialog";

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
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />

        {/* Modal */}
        <Dialog.Content
          onInteractOutside={(e) => disableClose && e.preventDefault()}
          onEscapeKeyDown={(e) => disableClose && e.preventDefault()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-700/50 bg-[#1E293B] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-5">
              <Dialog.Title className="text-lg font-semibold text-white">
                {title}
              </Dialog.Title>

              <Dialog.Close asChild>
                <button
                  disabled={disableClose}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </Dialog.Close>
            </div>

            {/* Accessibility (fix warning) */}
            <Dialog.Description className="sr-only">
              Admin form modal
            </Dialog.Description>

            {/* Body */}
            <div className="admin-modal-scroll max-h-[calc(90vh-81px)] overflow-y-auto px-6 py-6">
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AdminModal;
