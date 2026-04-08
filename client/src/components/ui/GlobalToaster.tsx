import { Toaster } from "sonner";

const GlobalToaster = () => {
  return (
    <Toaster
      position="bottom-right"
      expand
      closeButton
      richColors
      visibleToasts={4}
      toastOptions={{
        duration: 4500,
        unstyled: true,
        classNames: {
          toast:
            "!pointer-events-auto !flex !w-full !items-start !gap-3 !rounded-xl !border !border-slate-700/70 !bg-[#102347] !px-4 !py-3 !text-slate-100 !shadow-2xl !shadow-black/30",
          title: "!text-sm !font-semibold !text-white",
          description: "!mt-1 !text-sm !text-blue-100/85",
          success:
            "!border-blue-400/30 !bg-gradient-to-br !from-[#173B7A] !to-[#102347]",
          error:
            "!border-red-400/30 !bg-gradient-to-br !from-[#5B1D29] !to-[#2B1218]",
          closeButton:
            "!border !border-white/10 !bg-white/5 !text-slate-200 !transition-colors hover:!bg-white/10 hover:!text-white",
        },
      }}
    />
  );
};

export default GlobalToaster;
