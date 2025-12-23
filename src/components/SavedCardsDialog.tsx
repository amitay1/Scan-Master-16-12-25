/**
 * Saved Cards Dialog
 * UI for managing saved technique/report cards
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  FileText,
  ClipboardList,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  Download,
  Upload,
  MoreVertical,
  Clock,
  Calendar,
  Tag,
  Plus,
  X,
  FolderOpen,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useSavedCards } from '@/hooks/useSavedCards';
import { SavedCard, SavedCardsFilter } from '@/contexts/SavedCardsContext';
import { useSettingsApply } from '@/hooks/useSettingsApply';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface SavedCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadCard: (card: SavedCard) => void;
}

// ============================================================================
// CARD ITEM COMPONENT
// ============================================================================

function CardItem({ 
  card, 
  onLoad, 
  onToggleFavorite,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onExport,
  formatDate,
}: {
  card: SavedCard;
  onLoad: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
  formatDate: (date: string) => string;
}) {
  const completionColor = card.completionPercent >= 80 
    ? 'text-green-500' 
    : card.completionPercent >= 50 
      ? 'text-yellow-500' 
      : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-4 rounded-lg border transition-all duration-200 cursor-pointer group",
        "bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800",
        card.isArchived && "opacity-60"
      )}
      onClick={onLoad}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side - Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {card.type === 'technique' ? (
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
            ) : (
              <ClipboardList className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
            <h3 className="font-medium text-white truncate">{card.name}</h3>
            {card.isFavorite && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            )}
          </div>
          
          {card.description && (
            <p className="text-sm text-slate-400 truncate mb-2">{card.description}</p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(card.updatedAt)}
            </span>
            <span className={cn("flex items-center gap-1", completionColor)}>
              {card.completionPercent >= 80 ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {card.completionPercent}%
            </span>
            <Badge variant="outline" className="text-xs py-0">
              {card.standard}
            </Badge>
          </div>
          
          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs py-0">
                  {tag}
                </Badge>
              ))}
              {card.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs py-0">
                  +{card.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            {card.isFavorite ? (
              <StarOff className="w-4 h-4 text-yellow-400" />
            ) : (
              <Star className="w-4 h-4" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLoad(); }}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport(); }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}>
                {card.isArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN DIALOG COMPONENT
// ============================================================================

export function SavedCardsDialog({ open, onOpenChange, onLoadCard }: SavedCardsDialogProps) {
  const { 
    cards, 
    getFilteredCards, 
    toggleFavorite, 
    toggleArchive, 
    duplicateCard, 
    deleteCard,
    exportCard,
    exportAllCards,
    importCards,
    getAllTags,
  } = useSavedCards();
  
  const { formatDate } = useSettingsApply();
  
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'technique' | 'report'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'completionPercent'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Filter cards
  const filter: SavedCardsFilter = useMemo(() => ({
    type: activeTab === 'all' ? undefined : activeTab,
    searchQuery: searchQuery || undefined,
    showArchived,
    showFavoritesOnly,
    sortBy,
    sortOrder,
  }), [activeTab, searchQuery, showArchived, showFavoritesOnly, sortBy, sortOrder]);
  
  const filteredCards = useMemo(() => getFilteredCards(filter), [getFilteredCards, filter]);
  
  // Stats
  const stats = useMemo(() => ({
    total: cards.filter(c => !c.isArchived).length,
    techniques: cards.filter(c => c.type === 'technique' && !c.isArchived).length,
    reports: cards.filter(c => c.type === 'report' && !c.isArchived).length,
    favorites: cards.filter(c => c.isFavorite && !c.isArchived).length,
    archived: cards.filter(c => c.isArchived).length,
  }), [cards]);
  
  // Handlers
  const handleLoad = (card: SavedCard) => {
    onLoadCard(card);
    onOpenChange(false);
    toast.success(`Loaded "${card.name}"`);
  };
  
  const handleDuplicate = (id: string) => {
    const newCard = duplicateCard(id);
    if (newCard) {
      toast.success(`Created copy: "${newCard.name}"`);
    }
  };
  
  const handleDelete = (id: string) => {
    const card = cards.find(c => c.id === id);
    deleteCard(id);
    setDeleteConfirmId(null);
    toast.success(`Deleted "${card?.name}"`);
  };
  
  const handleExport = (id: string) => {
    const json = exportCard(id);
    if (json) {
      const card = cards.find(c => c.id === id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card?.name || 'card'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Card exported');
    }
  };
  
  const handleExportAll = () => {
    const json = exportAllCards();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanmaster-cards-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${cards.length} cards`);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string;
            // Validate JSON first
            JSON.parse(json);
            const count = importCards(json);
            if (count > 0) {
              toast.success(`Imported ${count} card${count > 1 ? 's' : ''} successfully`);
            } else {
              toast.error('No valid cards found. The file format may not be compatible.');
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            toast.error('Invalid JSON file. Please check the file format.');
          }
        };
        reader.onerror = () => {
          toast.error('Failed to read file');
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 bg-slate-900 border-slate-700">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-700">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              Saved Cards
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {stats.total} cards • {stats.techniques} techniques • {stats.reports} reports
            </DialogDescription>
          </DialogHeader>
          
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-slate-700 space-y-3">
            {/* Search and Actions */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-600"
                />
              </div>
              
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExportAll}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star className={cn("w-4 h-4 mr-1", showFavoritesOnly && "fill-current")} />
                Favorites ({stats.favorites})
              </Button>
              
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="w-4 h-4 mr-1" />
                Archived ({stats.archived})
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortOrder === 'desc' ? <SortDesc className="w-4 h-4 mr-1" /> : <SortAsc className="w-4 h-4 mr-1" />}
                    Sort: {sortBy === 'updatedAt' ? 'Date' : sortBy === 'name' ? 'Name' : 'Progress'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('updatedAt')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Last Updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('completionPercent')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completion %
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                    {sortOrder === 'desc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                    {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Tabs and Content */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-3 justify-start bg-slate-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="technique" className="data-[state=active]:bg-blue-600">
                <FileText className="w-4 h-4 mr-1" />
                Techniques ({stats.techniques})
              </TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-blue-600">
                <ClipboardList className="w-4 h-4 mr-1" />
                Reports ({stats.reports})
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 px-6 py-4">
              <AnimatePresence mode="popLayout">
                {filteredCards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-slate-400"
                  >
                    <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No cards found</p>
                    <p className="text-sm">
                      {searchQuery ? 'Try a different search term' : 'Save your first card to get started'}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {filteredCards.map((card) => (
                      <CardItem
                        key={card.id}
                        card={card}
                        onLoad={() => handleLoad(card)}
                        onToggleFavorite={() => toggleFavorite(card.id)}
                        onToggleArchive={() => toggleArchive(card.id)}
                        onDuplicate={() => handleDuplicate(card.id)}
                        onDelete={() => setDeleteConfirmId(card.id)}
                        onExport={() => handleExport(card.id)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The card will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
