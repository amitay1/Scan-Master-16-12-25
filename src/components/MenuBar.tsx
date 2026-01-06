import React from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { FileText, Save, Download, FolderOpen, Info, Book, LogOut, PackagePlus, Stethoscope, HardDrive, Usb } from "lucide-react";

interface MenuBarProps {
  onSave: () => void;
  onOpenSavedCards: () => void;
  onExport: () => void;
  onNew: () => void;
  onSignOut: () => void;
  onOpenDrawingEngine: () => void;
  onLoadSampleCards?: () => void;
  onExportDiagnostics?: () => void;
  onRunDiagnostics?: () => void;
  onOfflineUpdate?: () => void;
}

export const MenuBar = ({ onSave, onOpenSavedCards, onExport, onNew, onSignOut, onOpenDrawingEngine, onLoadSampleCards, onExportDiagnostics, onRunDiagnostics, onOfflineUpdate }: MenuBarProps) => {
  return (
    <Menubar className="border-b-2 border-border bg-card rounded-none h-12 px-3 flex-shrink-0">
      <MenubarMenu>
        <MenubarTrigger className="font-semibold text-base px-4 py-2">File</MenubarTrigger>
        <MenubarContent className="text-base">
          <MenubarItem onClick={onNew} className="text-base py-2">
            <FileText className="mr-3 h-5 w-5" />
            New Project
            <MenubarShortcut className="text-sm">Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onOpenSavedCards} className="text-base py-2">
            <FolderOpen className="mr-3 h-5 w-5" />
            Open
            <MenubarShortcut className="text-sm">Ctrl+O</MenubarShortcut>
          </MenubarItem>
          {onLoadSampleCards && (
            <MenubarItem onClick={onLoadSampleCards} className="text-base py-2">
              <PackagePlus className="mr-3 h-5 w-5" />
              Load Sample Cards
            </MenubarItem>
          )}
          <MenubarSeparator />
          <MenubarItem onClick={onSave} className="text-base py-2">
            <Save className="mr-3 h-5 w-5" />
            Save
            <MenubarShortcut className="text-sm">Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onExport} className="text-base py-2">
            <Download className="mr-3 h-5 w-5" />
            Export PDF
            <MenubarShortcut className="text-sm">Ctrl+E</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onSignOut} className="text-base py-2">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-semibold text-base px-4 py-2">Tools</MenubarTrigger>
        <MenubarContent className="text-base">
          <MenubarItem onClick={onOpenDrawingEngine} className="text-base py-2">
            Technical Drawing Engine (CAD)
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-semibold text-base px-4 py-2">Help</MenubarTrigger>
        <MenubarContent className="text-base">
          <MenubarItem onClick={() => window.open('https://github.com/scan-master-docs', '_blank')} className="text-base py-2">
            <Book className="mr-3 h-5 w-5" />
            Documentation
          </MenubarItem>
          <MenubarSeparator />
          {onRunDiagnostics && (
            <MenubarItem onClick={onRunDiagnostics} className="text-base py-2">
              <Stethoscope className="mr-3 h-5 w-5" />
              Run Diagnostics
            </MenubarItem>
          )}
          {onExportDiagnostics && (
            <MenubarItem onClick={onExportDiagnostics} className="text-base py-2">
              <HardDrive className="mr-3 h-5 w-5" />
              Export Diagnostics (USB)
            </MenubarItem>
          )}
          {onOfflineUpdate && (
            <MenubarItem onClick={onOfflineUpdate} className="text-base py-2">
              <Usb className="mr-3 h-5 w-5" />
              Install Update from USB
            </MenubarItem>
          )}
          <MenubarSeparator />
          <MenubarItem onClick={() => alert('Scan-Master v1.0.102\nNDT Inspection Planning System')} className="text-base py-2">
            <Info className="mr-3 h-5 w-5" />
            About
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
