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
import { FileText, Save, Download, FolderOpen, Settings, Info, Book, LogOut } from "lucide-react";

interface MenuBarProps {
  onSave: () => void;
  onOpenSavedCards: () => void;
  onExport: () => void;
  onNew: () => void;
  onSignOut: () => void;
  onOpenDrawingEngine: () => void;
}

export const MenuBar = ({ onSave, onOpenSavedCards, onExport, onNew, onSignOut, onOpenDrawingEngine }: MenuBarProps) => {
  return (
    <Menubar className="border-b border-border bg-card rounded-none h-10 px-2">
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
        <MenubarTrigger className="font-medium text-sm">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo
            <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo
            <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Copy
            <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste
            <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium text-sm">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Toggle 3D View</MenubarItem>
          <MenubarItem>Fullscreen</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Zoom In</MenubarItem>
          <MenubarItem>Zoom Out</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium text-sm">Tools</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </MenubarItem>
          <MenubarItem onClick={onOpenDrawingEngine}>
            Technical Drawing Engine (CAD)
          </MenubarItem>
          <MenubarItem>Calibration Calculator</MenubarItem>
          <MenubarItem>Inspection Validator</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium text-sm">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Book className="mr-2 h-4 w-4" />
            Documentation
          </MenubarItem>
          <MenubarItem>
            <Info className="mr-2 h-4 w-4" />
            About
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
