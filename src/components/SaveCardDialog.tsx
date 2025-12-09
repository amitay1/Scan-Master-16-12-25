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
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Save className="w-5 h-5 text-blue-400" />
            {isUpdate ? 'Update Card' : 'Save Card'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isUpdate 
              ? 'Update the saved card with your changes'
              : 'Save your current work to continue later'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="card-name">Name *</Label>
            <Input
              id="card-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Turbine Blade Inspection"
              className="bg-slate-800 border-slate-600"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="card-description">Description</Label>
            <Textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this inspection..."
              className="bg-slate-800 border-slate-600 h-20 resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="bg-slate-800 border-slate-600"
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
                    className="flex items-center gap-1 pr-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Favorite */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isUpdate ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
