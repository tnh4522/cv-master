import * as React from "react";
import type { ListSectionKey, SectionItemUnion } from "@/types/resume";

export type DialogMode = "create" | "edit" | null;

interface DialogContextValue {
  activeSection: ListSectionKey | null;
  mode: DialogMode;
  activeItem: SectionItemUnion | null;
  index: number | null;
  openDialog: (
    section: ListSectionKey,
    modeOrIndex?: DialogMode | number,
    item?: SectionItemUnion | null
  ) => void;
  closeDialog: () => void;
  updateDialog: (section: ListSectionKey, index: number) => void;
  isOpen: (section: ListSectionKey) => boolean;
}

export const DialogContext = React.createContext<DialogContextValue>({
  activeSection: null,
  mode: null,
  activeItem: null,
  index: null,
  openDialog: () => {},
  closeDialog: () => {},
  updateDialog: () => {},
  isOpen: () => false,
});

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = React.useState<ListSectionKey | null>(
    null
  );
  const [mode, setMode] = React.useState<DialogMode>(null);
  const [activeItem, setActiveItem] = React.useState<SectionItemUnion | null>(
    null
  );
  const [index, setIndex] = React.useState<number | null>(null);

  const openDialog = React.useCallback(
    (
      section: ListSectionKey,
      modeOrIndex: DialogMode | number = "create",
      item: SectionItemUnion | null = null
    ) => {
      setActiveSection(section);
      if (typeof modeOrIndex === "number") {
        setIndex(modeOrIndex);
        setMode("edit");
      } else {
        setIndex(null);
        setMode(modeOrIndex || "create");
      }
      setActiveItem(item);
    },
    []
  );

  const updateDialog = React.useCallback(
    (section: ListSectionKey, idx: number) => {
      setActiveSection(section);
      setIndex(idx);
      setMode("edit");
    },
    []
  );

  const closeDialog = React.useCallback(() => {
    setActiveSection(null);
    setMode(null);
    setActiveItem(null);
    setIndex(null);
  }, []);

  const isOpen = React.useCallback(
    (section: ListSectionKey) => activeSection === section && mode !== null,
    [activeSection, mode]
  );

  const value = React.useMemo(
    () => ({
      activeSection,
      mode,
      activeItem,
      index,
      openDialog,
      closeDialog,
      updateDialog,
      isOpen,
    }),
    [activeSection, mode, activeItem, index, openDialog, closeDialog, updateDialog, isOpen]
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
