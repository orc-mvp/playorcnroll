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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface ManifestComplicationModalProps {
  complicationId: string;
  sessionId: string;
  description: string;
  characterName: string;
  onClose: () => void;
  onManifested: () => void;
}

export function ManifestComplicationModal({
  complicationId,
  sessionId,
  description,
  characterName,
  onClose,
  onManifested,
}: ManifestComplicationModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [manifestNote, setManifestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManifest = async () => {
    setIsSubmitting(true);

    try {
      await supabase
        .from('complications')
        .update({
          is_manifested: true,
          manifested_at: new Date().toISOString(),
          manifest_note: manifestNote.trim() || null,
        })
        .eq('id', complicationId);

      // Create event for feed
      await supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'complication_manifested',
        event_data: {
          character_name: characterName,
          description,
          manifest_note: manifestNote.trim() || null,
        },
      });

      toast({ title: t.complications.manifested });
      onManifested();
      onClose();
    } catch (error) {
      console.error('Error manifesting complication:', error);
      toast({ title: 'Erro ao manifestar complicação', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t.complications.manifestComplication}
          </DialogTitle>
          <DialogDescription className="font-body">
            Resolver narrativamente a complicação de{' '}
            <span className="font-medieval text-foreground">{characterName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Current Complication */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="font-body text-sm">{description}</p>
          </div>

          {/* Manifest Note */}
          <div className="space-y-2">
            <Label htmlFor="manifest-note" className="font-medieval">
              {t.complications.manifestNote}
            </Label>
            <Textarea
              id="manifest-note"
              value={manifestNote}
              onChange={(e) => setManifestNote(e.target.value)}
              placeholder="Como a complicação se manifestou na narrativa..."
              className="font-body min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleManifest} disabled={isSubmitting}>
            {isSubmitting ? t.common.loading : t.complications.manifest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
