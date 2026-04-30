import { Toaster } from "sonner";

const GlobalToaster = () => {
  return (
    <Toaster
      position="bottom-left"
      expand
      closeButton
      richColors
      visibleToasts={4}
      className="
        !fixed 
        !bottom-4 
        !left-4 
        sm:!left-6 
        !right-auto 
        !w-[min(90vw,380px)] 
        !max-w-[380px] 
        !z-[9999]
        [--mobile-offset-right:0px]
        [--offset-right:0px]
        [--mobile-offset-left:1rem]
        [--offset-left:1.5rem]
        [--mobile-offset-bottom:1rem]
        [--offset-bottom:1rem]
      "
      toastOptions={{
        duration: 4500,
        unstyled: true,
        classNames: {
          toast:
            "!pointer-events-auto !flex !w-full !items-start gap-2 sm:!gap-2.5 !rounded-xl !border !border-slate-700/70 !bg-[#102347] !px-4 !py-3 !text-slate-100 !shadow-2xl !shadow-black/30 !m-0",
          title: "!text-sm !font-semibold !text-white",
          description: "!mt-1 !text-sm !text-blue-100/85",
          success:
            "!border-blue-400/30 !bg-gradient-to-br !from-[#173B7A] !to-[#102347]",
          error:
            "!border-red-400/30 !bg-gradient-to-br !from-[#5B1D29] !to-[#2B1218]",
          closeButton:
            "!bg-transparent !text-slate-200 !transition-colors hover:!bg-white/10 hover:!text-white ml-auto !order-last",
        },
      }}
    />
  );
};

export default GlobalToaster;
