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
import { FileText, Save, Download, FolderOpen, Info, Book, LogOut, PackagePlus } from "lucide-react";

interface MenuBarProps {
  onSave: () => void;
  onOpenSavedCards: () => void;
  onExport: () => void;
  onNew: () => void;
  onSignOut: () => void;
  onOpenDrawingEngine: () => void;
  onLoadSampleCards?: () => void;
}

export const MenuBar = ({ onSave, onOpenSavedCards, onExport, onNew, onSignOut, onOpenDrawingEngine, onLoadSampleCards }: MenuBarProps) => {
  return (
    <Menubar className="border-b border-border bg-card rounded-none h-10 px-2 flex-shrink-0">
      <MenubarMenu>
        <MenubarTrigger className="font-medium text-sm">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onNew}>
            <FileText className="mr-2 h-4 w-4" />
            New Project
            <MenubarShortcut>Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onOpenSavedCards}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
          </MenubarItem>
          {onLoadSampleCards && (
            <MenubarItem onClick={onLoadSampleCards}>
              <PackagePlus className="mr-2 h-4 w-4" />
              Load Sample Cards
            </MenubarItem>
          )}
          <MenubarSeparator />
          <MenubarItem onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
            <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
            <MenubarShortcut>Ctrl+E</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium text-sm">Tools</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onOpenDrawingEngine}>
            Technical Drawing Engine (CAD)
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium text-sm">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => window.open('https://github.com/scan-master-docs', '_blank')}>
            <Book className="mr-2 h-4 w-4" />
            Documentation
          </MenubarItem>
          <MenubarItem onClick={() => alert('Scan-Master v1.0.0\nNDT Inspection Planning System')}>
            <Info className="mr-2 h-4 w-4" />
            About
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
