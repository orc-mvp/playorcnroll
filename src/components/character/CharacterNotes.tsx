import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { StickyNote, Plus, Trash2, Check } from 'lucide-react';

interface NoteItem {
  id: string;
  text: string;
}

interface CharacterNotesProps {
  characterId: string;
  initialNotes?: string;
  readOnly?: boolean;
}

function genId() {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseNotes(raw: string | null | undefined): NoteItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((n) => n && typeof n.text === 'string')
        .map((n) => ({ id: typeof n.id === 'string' ? n.id : genId(), text: n.text }));
    }
  } catch {
    // legacy plain text
  }
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return [{ id: genId(), text: raw }];
}

function serializeNotes(notes: NoteItem[]): string {
  return JSON.stringify(notes);
}

export function CharacterNotes({ characterId, initialNotes = '', readOnly = false }: CharacterNotesProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [notes, setNotes] = useState<NoteItem[]>(() => parseNotes(initialNotes));
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRealtimeRef = useRef(false);

  // Sync with external changes
  useEffect(() => {
    setNotes(parseNotes(initialNotes));
  }, [initialNotes]);

  // Realtime
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
          if (skipNextRealtimeRef.current) {
            skipNextRealtimeRef.current = false;
            return;
          }
          const newNotes = (payload.new as any).notes;
          if (typeof newNotes === 'string') {
            setNotes(parseNotes(newNotes));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const persist = useCallback(
    async (value: NoteItem[]) => {
      skipNextRealtimeRef.current = true;
      const { error } = await supabase
        .from('characters')
        .update({ notes: serializeNotes(value) })
        .eq('id', characterId);
      if (error) {
        toast({ title: t.common.errorSaving, variant: 'destructive' });
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    },
    [characterId, t, toast]
  );

  const scheduleSave = useCallback(
    (value: NoteItem[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persist(value), 800);
    },
    [persist]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAdd = () => {
    const next = [...notes, { id: genId(), text: '' }];
    setNotes(next);
    persist(next);
  };

  const handleChange = (id: string, text: string) => {
    const next = notes.map((n) => (n.id === id ? { ...n, text } : n));
    setNotes(next);
    scheduleSave(next);
  };

  const handleDelete = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    persist(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
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
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="h-7 px-2 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic font-body py-2">
          {t.characterSheet.notesPlaceholder}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-2 w-full"
            >
              <Textarea
                value={note.text}
                onChange={(e) => handleChange(note.id, e.target.value)}
                placeholder={t.characterSheet.notesPlaceholder}
                readOnly={readOnly}
                className="flex-1 min-h-[64px] resize-y bg-muted/30 border-border font-body text-sm"
              />
              {!readOnly && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.common.delete}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {note.text ? note.text.slice(0, 120) : t.characterSheet.notesPlaceholder}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(note.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t.common.confirm}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
