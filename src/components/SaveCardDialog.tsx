/**
 * Save Card Dialog
 * UI for saving current work as a card
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Save, Tag, X, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';

interface SaveCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description?: string;
    tags: string[];
    isFavorite: boolean;
  }) => void;
  defaultName?: string;
  isUpdate?: boolean;
  currentTags?: string[];
  currentName?: string;
  currentDescription?: string;
  currentIsFavorite?: boolean;
}

export function SaveCardDialog({
  open,
  onOpenChange,
  onSave,
  defaultName = '',
  isUpdate = false,
  currentTags = [],
  currentName = '',
  currentDescription = '',
  currentIsFavorite = false,
}: SaveCardDialogProps) {
  const [name, setName] = useState(currentName || defaultName);
  const [description, setDescription] = useState(currentDescription);
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(currentIsFavorite);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the card');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      tags,
      isFavorite,
    });

    // Reset form
    setName('');
    setDescription('');
    setTags([]);
    setNewTag('');
    setIsFavorite(false);
    
    onOpenChange(false);
    toast.success(isUpdate ? 'Card updated!' : 'Card saved!');
  };

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName(currentName || defaultName);
      setDescription(currentDescription);
      setTags(currentTags);
      setIsFavorite(currentIsFavorite);
    }
  }, [open, currentName, defaultName, currentDescription, currentTags, currentIsFavorite]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(12,18,28,0.98))] p-0 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
        <DialogHeader className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(12,18,28,0.96))] px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
              <Save className="w-5 h-5 text-blue-300" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-blue-400/20 bg-blue-500/10 text-blue-200">
                  {isUpdate ? 'Update Existing Card' : 'Create Saved Card'}
                </Badge>
                {isFavorite && (
                  <Badge variant="outline" className="border-yellow-400/20 bg-yellow-500/10 text-yellow-200">
                    Favorite
                  </Badge>
                )}
              </div>
              <DialogTitle className="flex items-center gap-2 text-white text-xl">
                <Save className="w-5 h-5 text-blue-400" />
                {isUpdate ? 'Update Card' : 'Save Card'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {isUpdate 
                  ? 'Update the current saved card without creating a duplicate'
                  : 'Store the current workspace so you can reopen it later from My Cards'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Mode</div>
              <div className="mt-1 text-sm font-semibold text-white">{isUpdate ? 'Update' : 'Create'}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Tags</div>
              <div className="mt-1 text-sm font-semibold text-white">{tags.length}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Status</div>
              <div className="mt-1 text-sm font-semibold text-white">{isFavorite ? 'Favorite' : 'Standard'}</div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Label htmlFor="card-name" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Name *</Label>
            <Input
              id="card-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Turbine Blade Inspection"
              className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500"
              autoFocus
            />

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="card-description" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Description</Label>
              <Textarea
                id="card-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this inspection..."
                className="h-24 resize-none rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="h-11 rounded-2xl border-white/10 bg-black/15 text-slate-100 placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="h-11 w-11 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.05] pr-1 text-slate-200"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-red-500/15 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Favorite */}
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-slate-100">
                <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                Add to Favorites
              </Label>
              <p className="text-xs text-slate-500">
                Favorite cards appear at the top of your list
              </p>
            </div>
            <Switch
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-white/8 bg-black/15 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
            <Save className="w-4 h-4 mr-2" />
            {isUpdate ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
