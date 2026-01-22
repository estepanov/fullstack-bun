import { isDemoMode } from "@admin/lib/demo";
import { Button } from "frontend-common/components/ui";
import { useEffect, useState } from "react";

const DEMO_WELCOME_KEY = "admin-demo-welcome";

export const DemoWelcomeModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    const dismissed = window.sessionStorage.getItem(DEMO_WELCOME_KEY) === "true";
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    window.sessionStorage.setItem(DEMO_WELCOME_KEY, "true");
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <button
          type="button"
          className="fixed inset-0 bg-black/60 transition-opacity"
          onClick={handleClose}
          onKeyDown={(event) => event.key === "Escape" && handleClose()}
          aria-label="Close demo notice"
        />
        <div className="relative transform overflow-hidden rounded-3xl border border-border/70 bg-card/95 text-left shadow-xl backdrop-blur transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <title>Demo information</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.018.704v.944m0 3.052h.008v.008h-.008v-.008z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z"
                  />
                </svg>
              </div>
              <div className="mt-3 flex-1 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-foreground">
                  Welcome to the Admin Demo
                </h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This is a public demo. It does not use a backend or real
                    authentication.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All data and requests are mocked locally via MSW, so nothing touches
                    the API.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You may see taosts/notifications in the app but data will not be
                    mutated and there is no state in this demo.
                  </p>
                  <p className="font-bold">
                    This functionallity is fully available in the live version.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/70 bg-muted/40 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              type="button"
              onClick={handleClose}
              className="w-full sm:ml-3 sm:w-auto"
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
