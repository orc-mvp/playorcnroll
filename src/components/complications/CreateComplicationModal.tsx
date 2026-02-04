import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle, 
  Users, 
  Footprints, 
  Handshake, 
  Coins, 
  Skull 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateComplicationModalProps {
  sessionId: string;
  characterId: string;
  characterName: string;
  onClose: () => void;
  onCreated: () => void;
}

const complicationTypes = [
  { id: 'reputational', icon: Users, labelKey: 'reputational' },
  { id: 'tracking', icon: Footprints, labelKey: 'tracking' },
  { id: 'betrayal', icon: Handshake, labelKey: 'betrayal' },
  { id: 'debt', icon: Coins, labelKey: 'debt' },
  { id: 'minor_curse', icon: Skull, labelKey: 'minorCurse' },
] as const;

export function CreateComplicationModal({
  sessionId,
  characterId,
  characterName,
  onClose,
  onCreated,
}: CreateComplicationModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [type, setType] = useState<string>('reputational');
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: 'Descrição é obrigatória', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('complications').insert({
        session_id: sessionId,
        character_id: characterId,
        type,
        description: description.trim(),
        is_visible: isVisible,
      });

      if (error) throw error;

      // Create event for feed
      await supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'complication_created',
        event_data: {
          character_id: characterId,
          character_name: characterName,
          type,
          is_visible: isVisible,
        },
      });

      toast({ title: 'Complicação criada!' });
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating complication:', error);
      toast({ title: 'Erro ao criar complicação', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {t.complications.create}
          </DialogTitle>
          <DialogDescription className="font-body">
            Criar complicação para <span className="font-medieval text-foreground">{characterName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="font-medieval">{t.complications.type}</Label>
            <RadioGroup value={type} onValueChange={setType}>
              <div className="grid grid-cols-2 gap-2">
                {complicationTypes.map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <div key={ct.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={ct.id} id={ct.id} />
                      <Label 
                        htmlFor={ct.id} 
                        className={cn(
                          "flex items-center gap-2 cursor-pointer font-body text-sm",
                          type === ct.id && "text-primary"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {t.complications[ct.labelKey as keyof typeof t.complications]}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-medieval">
              {t.complications.description}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a complicação..."
              className="font-body min-h-[100px] resize-none"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <Label className="font-medieval">{t.complications.visibleToPlayer}</Label>
              <p className="text-xs text-muted-foreground font-body">
                {isVisible ? t.complications.visible : t.complications.hidden}
              </p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!description.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? t.common.loading : t.common.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
