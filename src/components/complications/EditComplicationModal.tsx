import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Pencil,
  Users,
  Footprints,
  Handshake,
  Coins,
  Skull,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface EditComplicationModalProps {
  complication: {
    id: string;
    type: string;
    description: string;
    is_visible: boolean;
  };
  characterName: string;
  onClose: () => void;
  onUpdated: () => void;
}

const complicationTypes = [
  { value: 'reputational', icon: Users, labelKey: 'reputational' },
  { value: 'tracking', icon: Footprints, labelKey: 'tracking' },
  { value: 'betrayal', icon: Handshake, labelKey: 'betrayal' },
  { value: 'debt', icon: Coins, labelKey: 'debt' },
  { value: 'minor_curse', icon: Skull, labelKey: 'minorCurse' },
] as const;

export function EditComplicationModal({
  complication,
  characterName,
  onClose,
  onUpdated,
}: EditComplicationModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [type, setType] = useState(complication.type);
  const [description, setDescription] = useState(complication.description);
  const [isVisible, setIsVisible] = useState(complication.is_visible);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('complications')
        .update({
          type,
          description: description.trim(),
          is_visible: isVisible,
        })
        .eq('id', complication.id);

      if (error) throw error;

      toast({ title: t.complications.complicationUpdated, duration: 2000 });
      onUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: t.complications.errorUpdating,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            {t.complications.editComplication}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
          {/* Character */}
          <div className="text-sm text-muted-foreground font-body">
            {t.complications.character}: <span className="text-foreground font-medieval">{characterName}</span>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="font-medieval text-sm">{t.complications.type}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {complicationTypes.map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <SelectItem key={ct.value} value={ct.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>
                          {t.complications[ct.labelKey as keyof typeof t.complications]}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medieval text-sm">{t.complications.description}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.complications.describePlaceholder}
              className="font-body min-h-[100px] resize-none"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              {isVisible ? (
                <Eye className="w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medieval text-sm">{t.complications.visible}</p>
                <p className="text-xs text-muted-foreground font-body">
                  {isVisible
                    ? t.complications.playerCanSee
                    : t.complications.onlyNarratorCanSee}
                </p>
              </div>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!description.trim() || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                t.common.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
