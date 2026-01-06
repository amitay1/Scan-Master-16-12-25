/**
 * Saved Cards Dialog
 * UI for managing saved technique/report cards with beautiful design
 * Cards are filtered by profile - each profile sees only its own cards
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  FolderOpen,
  SortAsc,
  SortDesc,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileCheck,
  ArrowRight,
  User,
} from 'lucide-react';
import { useSavedCards } from '@/hooks/useSavedCards';
import { SavedCard, SavedCardsFilter } from '@/contexts/SavedCardsContext';
import { useInspectorProfile } from '@/contexts/InspectorProfileContext';
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
// BEAUTIFUL CARD COMPONENT
// ============================================================================

function BeautifulCardItem({ 
  card, 
  onLoad, 
  onToggleFavorite,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onExport,
}: {
  card: SavedCard;
  onLoad: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const getCompletionColor = (percent: number) => {
    if (percent >= 80) return 'from-emerald-500 to-green-400';
    if (percent >= 50) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-red-400';
  };

  const getCompletionBg = (percent: number) => {
    if (percent >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (percent >= 50) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-rose-500/10 border-rose-500/30';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer group",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10",
        card.isArchived ? "opacity-50 border-slate-700" : "border-slate-700/50",
        card.isFavorite && "border-yellow-500/30"
      )}
      onClick={onLoad}
    >
      {/* Gradient Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
        card.type === 'technique' ? 'from-blue-500 via-cyan-500 to-teal-500' : 'from-purple-500 via-pink-500 to-rose-500'
      )} />

      {/* Favorite Star */}
      {card.isFavorite && (
        <div className="absolute top-3 left-3 z-10">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
        </div>
      )}

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Type Icon */}
            <div className={cn(
              "flex-shrink-0 p-2.5 rounded-xl",
              card.type === 'technique' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-purple-500/20 text-purple-400'
            )}>
              {card.type === 'technique' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <ClipboardList className="w-5 h-5" />
              )}
            </div>
            
            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg truncate leading-tight">
                {card.name}
              </h3>
              {card.description && (
                <p className="text-sm text-slate-400 truncate mt-0.5">
                  {card.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLoad(); }}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
                {card.isFavorite ? (
                  <>
                    <StarOff className="w-4 h-4 mr-2" />
                    Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Add to Favorites
                  </>
                )}
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

        {/* Progress Section */}
        <div className={cn(
          "rounded-lg p-3 mb-4 border",
          getCompletionBg(card.completionPercent)
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300 flex items-center gap-1.5">
              {card.completionPercent >= 80 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              Progress
            </span>
            <span className={cn(
              "font-bold text-lg",
              card.completionPercent >= 80 ? 'text-emerald-400' : 
              card.completionPercent >= 50 ? 'text-amber-400' : 'text-rose-400'
            )}>
              {card.completionPercent}%
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${card.completionPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn("h-full rounded-full bg-gradient-to-r", getCompletionColor(card.completionPercent))}
            />
          </div>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(card.updatedAt)}
            </span>
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              {card.standard}
            </Badge>
          </div>
          
          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex gap-1">
              {card.tags.slice(0, 2).map(tag => (
                <Badge key={tag} className="text-xs bg-slate-700/50 text-slate-300">
                  {tag}
                </Badge>
              ))}
              {card.tags.length > 2 && (
                <Badge className="text-xs bg-slate-700/50 text-slate-300">
                  +{card.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Load Button - appears on hover */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-500 gap-2"
            onClick={(e) => { e.stopPropagation(); onLoad(); }}
          >
            Open & Continue Editing
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({ searchQuery, profileName }: { searchQuery: string; profileName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {searchQuery ? 'No cards found' : 'No saved cards'}
      </h3>
      <p className="text-slate-400 max-w-sm">
        {searchQuery 
          ? 'Try searching with different keywords' 
          : profileName 
            ? `Profile "${profileName}" has no saved cards yet`
            : 'Save your first card to continue working on it later'}
      </p>
      {!searchQuery && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4" />
          Tip: Click the save button (💾) in the toolbar
        </div>
      )}
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
  } = useSavedCards();
  
  const { currentProfile } = useInspectorProfile();
  
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
    toast.success(`Loaded: "${card.name}"`);
  };
  
  const handleDuplicate = (id: string) => {
    const newCard = duplicateCard(id);
    if (newCard) {
      toast.success(`Duplicated: "${newCard.name}"`);
    }
  };
  
  const handleDelete = (id: string) => {
    const card = cards.find(c => c.id === id);
    deleteCard(id);
    setDeleteConfirmId(null);
    toast.success(`Deleted: "${card?.name}"`);
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
      toast.success('Card exported successfully');
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
            JSON.parse(json);
            const count = importCards(json);
            if (count > 0) {
              toast.success(`Imported ${count} cards successfully`);
            } else {
              toast.error('No valid cards found in file');
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            toast.error('Invalid JSON file');
          }
        };
        reader.onerror = () => {
          toast.error('Error reading file');
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-700">
          {/* Header */}
          <DialogHeader className="px-6 py-5 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <FolderOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  My Cards
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1 flex items-center gap-2">
                  {currentProfile && (
                    <>
                      <User className="w-4 h-4" />
                      <span className="text-blue-400 font-medium">{currentProfile.name}</span>
                      <span>•</span>
                    </>
                  )}
                  {stats.total} cards • {stats.techniques} technique • {stats.reports} reports
                </DialogDescription>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-3">
                <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-yellow-400">{stats.favorites}</span>
                  </div>
                  <div className="text-xs text-yellow-400/70">Favorites</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">
                      {cards.filter(c => c.completionPercent >= 80).length}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-400/70">Completed</div>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-700/50 space-y-4 bg-slate-900/30">
            {/* Search and Actions */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600 h-11 text-base"
                />
              </div>
              
              <Button variant="outline" onClick={handleImport} className="h-11 gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
              
              <Button variant="outline" onClick={handleExportAll} className="h-11 gap-2" disabled={cards.length === 0}>
                <Download className="w-4 h-4" />
                Export All
              </Button>
            </div>
            
            {/* Tabs and Filters */}
            <div className="flex items-center justify-between gap-4">
              {/* Type Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('all')}
                  className={cn(activeTab === 'all' && 'bg-blue-600')}
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={activeTab === 'technique' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('technique')}
                  className={cn(activeTab === 'technique' && 'bg-blue-600', "gap-1")}
                >
                  <FileText className="w-4 h-4" />
                  Technique ({stats.techniques})
                </Button>
                <Button
                  variant={activeTab === 'report' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('report')}
                  className={cn(activeTab === 'report' && 'bg-purple-600', "gap-1")}
                >
                  <ClipboardList className="w-4 h-4" />
                  Reports ({stats.reports})
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Button
                  variant={showFavoritesOnly ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="gap-1"
                >
                  <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-yellow-400 text-yellow-400")} />
                  Favorites
                </Button>
                
                <Button
                  variant={showArchived ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="gap-1"
                >
                  <Archive className="w-4 h-4" />
                  Archive ({stats.archived})
                </Button>
                
                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                      {sortBy === 'updatedAt' ? 'Date' : sortBy === 'name' ? 'Name' : 'Progress'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem onClick={() => setSortBy('updatedAt')}>
                      <Clock className="w-4 h-4 mr-2" />
                      Update Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('completionPercent')}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
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
          </div>
          
          {/* Cards Grid */}
          <ScrollArea className="flex-1 px-6 py-6">
            <AnimatePresence mode="popLayout">
              {filteredCards.length === 0 ? (
                <EmptyState searchQuery={searchQuery} profileName={currentProfile?.name} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredCards.map((card) => (
                    <BeautifulCardItem
                      key={card.id}
                      card={card}
                      onLoad={() => handleLoad(card)}
                      onToggleFavorite={() => toggleFavorite(card.id)}
                      onToggleArchive={() => toggleArchive(card.id)}
                      onDuplicate={() => handleDuplicate(card.id)}
                      onDelete={() => setDeleteConfirmId(card.id)}
                      onExport={() => handleExport(card.id)}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The card will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
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
