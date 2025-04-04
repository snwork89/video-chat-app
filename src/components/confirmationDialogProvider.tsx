"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

type ConfirmDialogFn = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmDialogFn | undefined>(
  undefined
);

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOptions, setDialogOptions] = useState<ConfirmDialogOptions | null>(null);
  const [promiseResolver, setPromiseResolver] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm: ConfirmDialogFn = useCallback((options) => {
    setDialogOptions(options);
    return new Promise((resolve) => {
      setPromiseResolver(() => resolve);
    });
  }, []);

  const handleClose = (result: boolean) => {
    setDialogOptions(null);
    promiseResolver?.(result);
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}

      <AlertDialog open={!!dialogOptions} onOpenChange={() => handleClose(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogOptions?.title || "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogOptions?.description || "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleClose(false)}>
              {dialogOptions?.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleClose(true)}>
              {dialogOptions?.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
};


export const useConfirmDialog = (): ConfirmDialogFn => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return context;
};