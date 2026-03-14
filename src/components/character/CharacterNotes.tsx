import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StickyNote, Check, Save } from 'lucide-react';

interface CharacterNotesProps {
  characterId: string;
  initialNotes?: string;
  readOnly?: boolean;
}

export function CharacterNotes({ characterId, initialNotes = '' }: CharacterNotesProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external changes (e.g. realtime)
  useEffect(() => {
    setNotes(initialNotes);
    setDirty(false);
  }, [initialNotes]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`character-notes-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        (payload) => {
          const newNotes = (payload.new as any).notes;
          if (typeof newNotes === 'string') {
            setNotes(newNotes);
            setDirty(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const saveNotes = useCallback(async (value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('characters')
      .update({ notes: value })
      .eq('id', characterId);

    setSaving(false);
    if (error) {
      toast({
        title: t.common.errorSaving,
        variant: 'destructive',
      });
    } else {
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [characterId, t, toast]);

  const handleChange = (value: string) => {
    setNotes(value);
    setDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNotes(value), 1000);
  };

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveNotes(notes);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medieval text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <StickyNote className="w-4 h-4" />
          {t.characterSheet.notes}
        </h4>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t.characterSheet.notesSaved}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={!dirty || saving}
            className="h-7 px-2 text-xs gap-1"
          >
            <Save className="w-3 h-3" />
            {t.common.save}
          </Button>
        </div>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t.characterSheet.notesPlaceholder}
        className="min-h-[100px] resize-y bg-muted/30 border-border font-body text-sm"
      />
    </div>
  );
}
