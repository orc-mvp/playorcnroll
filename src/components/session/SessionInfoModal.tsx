import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SimpleEditor } from '@/components/ui/simple-editor';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { Pencil } from 'lucide-react';

interface SessionInfo {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
}

interface SessionInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionInfo;
  isNarrator: boolean;
  onSessionUpdate?: (updates: { description: string | null }) => void;
}

export function SessionInfoModal({
  open,
  onOpenChange,
  session,
  isNarrator,
  onSessionUpdate,
}: SessionInfoModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setDraft(session.description || '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('sessions')
      .update({ description: draft.trim() || null })
      .eq('id', session.id);
    setSaving(false);

    if (error) {
      toast({ title: t.common.errorSaving, variant: 'destructive' });
    } else {
      onSessionUpdate?.({ description: draft.trim() || null });
      setEditing(false);
      toast({ title: t.common.save });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditing(false); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="font-medieval text-xl">{session.name}</DialogTitle>
          {isNarrator && !editing && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medieval text-sm text-muted-foreground mb-2">
              {t.session.description}
            </h3>
            {editing ? (
              <div className="space-y-3">
                <SimpleEditor
                  value={draft}
                  onChange={setDraft}
                  placeholder={t.session.sessionDescPlaceholder}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button size="sm" disabled={saving} onClick={handleSave}>
                    {saving ? t.common.saving : t.common.save}
                  </Button>
                </div>
              </div>
            ) : session.description ? (
              <RichTextDisplay content={session.description} className="text-muted-foreground" />
            ) : (
              <p className="text-sm text-muted-foreground italic font-body">
                {t.session.sessionDescPlaceholder}
              </p>
            )}
          </div>

          {/* Invite Code */}
          <div>
            <h3 className="font-medieval text-sm text-muted-foreground mb-1">
              {t.session.inviteCode}
            </h3>
            <span className="font-mono text-lg tracking-widest">{session.invite_code}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
