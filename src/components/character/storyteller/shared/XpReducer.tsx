/**
 * XpReducer — botão para o jogador reduzir seu próprio pool global de XP
 * com dupla confirmação. Atualiza characters.experience_points em tempo real.
 *
 * Exibe um log de XP recebido/gasto (xp_log) abaixo do formulário, mostrando
 * quem concedeu cada ponto. Usado em todas as fichas do Storyteller (Vampiro,
 * Lobisomem, Mago, Metamorfos) e na página /character/:id.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, AlertTriangle, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';

interface XpReducerProps {
  characterId: string;
  currentXp: number;
}

interface XpLogEntry {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
  awarded_by: string;
  awarded_by_name?: string;
}

export function XpReducer({ characterId, currentXp }: XpReducerProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState<XpLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  const parsed = Number.parseInt(amount, 10);
  const isValid =
    Number.isFinite(parsed) && parsed > 0 && parsed <= currentXp;

  const fetchLog = useCallback(async () => {
    setLoadingLog(true);
    const { data, error } = await supabase
      .from('xp_log')
      .select('id, amount, reason, created_at, awarded_by')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('[XpReducer] fetch log:', error);
      setLog([]);
      setLoadingLog(false);
      return;
    }
    const ids = Array.from(new Set((data ?? []).map((e) => e.awarded_by)));
    let names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ids);
      names = Object.fromEntries(
        (profiles ?? []).map((p) => [p.user_id, p.display_name ?? ''])
      );
    }
    setLog(
      (data ?? []).map((e) => ({
        ...e,
        awarded_by_name: names[e.awarded_by] || e.awarded_by.slice(0, 8).toUpperCase(),
      }))
    );
    setLoadingLog(false);
  }, [characterId]);

  useEffect(() => {
    if (!open) return;
    fetchLog();
    const channel = supabase
      .channel(`xp-log-${characterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'xp_log', filter: `character_id=eq.${characterId}` },
        () => fetchLog()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, characterId, fetchLog]);

  const reset = () => {
    setAmount('');
    setConfirmed(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    setOpen(next);
  };

  const handleConfirm = async () => {
    if (!isValid || !confirmed) return;
    setSaving(true);
    try {
      const newXp = Math.max(0, currentXp - parsed);
      const { error } = await supabase
        .from('characters')
        .update({ experience_points: newXp })
        .eq('id', characterId);
      if (error) throw error;

      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        await supabase.from('xp_log').insert({
          character_id: characterId,
          awarded_by: auth.user.id,
          amount: -parsed,
        });
      }
      toast({
        title: t.xpReducer?.successTitle || 'XP atualizado',
        description: (t.xpReducer?.successDescription || 'Foram gastos {n} XP.').replace(
          '{n}',
          String(parsed),
        ),
      });
      reset();
    } catch (err) {
      console.error('[XpReducer] update error:', err);
      toast({
        title: t.common?.errorSaving || 'Erro ao salvar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t.xpReducer?.spendXp || 'Usar XP'}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-medieval flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              {t.xpReducer?.title || 'Gastar Experiência'}
            </DialogTitle>
            <DialogDescription className="font-body">
              {t.xpReducer?.description ||
                'Esta ação reduz seu pool de XP permanentemente. Confirme com cuidado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm font-body">
              <span className="text-muted-foreground">
                {t.xpReducer?.currentXp || 'XP atual'}:
              </span>{' '}
              <span className="font-mono font-bold">{currentXp}</span>
            </div>

            {currentXp > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="xp-amount" className="font-body">
                    {t.xpReducer?.amountLabel || 'Quantos pontos gastar?'}
                  </Label>
                  <Input
                    id="xp-amount"
                    type="number"
                    min={1}
                    max={currentXp}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                  {amount && !isValid && (
                    <p className="text-xs text-destructive font-body">
                      {(t.xpReducer?.invalidAmount ||
                        'Valor inválido. Deve ser entre 1 e {max}.').replace(
                        '{max}',
                        String(currentXp),
                      )}
                    </p>
                  )}
                  {isValid && (
                    <p className="text-xs text-muted-foreground font-body">
                      {(t.xpReducer?.resultPreview || 'XP restante: {n}').replace(
                        '{n}',
                        String(currentXp - parsed),
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                  <Checkbox
                    id="xp-confirm"
                    checked={confirmed}
                    onCheckedChange={(c) => setConfirmed(c === true)}
                    disabled={!isValid}
                  />
                  <Label
                    htmlFor="xp-confirm"
                    className="text-xs font-body leading-snug cursor-pointer"
                  >
                    {t.xpReducer?.confirmCheckbox ||
                      'Confirmo que desejo gastar este XP. Esta ação não pode ser desfeita pelo jogador.'}
                  </Label>
                </div>
              </>
            )}

            {/* XP History log */}
            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medieval">
                <History className="w-4 h-4 text-muted-foreground" />
                <span>Histórico de XP</span>
              </div>
              {loadingLog ? (
                <p className="text-xs text-muted-foreground font-body">Carregando...</p>
              ) : log.length === 0 ? (
                <p className="text-xs text-muted-foreground font-body italic">
                  Nenhum registro ainda.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {log.map((entry) => {
                    const isGain = entry.amount > 0;
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-2 text-xs font-body rounded border border-border/60 bg-background/40 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isGain ? (
                            <Plus className="w-3 h-3 text-green-500 shrink-0" />
                          ) : (
                            <Minus className="w-3 h-3 text-destructive shrink-0" />
                          )}
                          <span
                            className={`font-mono font-bold shrink-0 ${
                              isGain ? 'text-green-500' : 'text-destructive'
                            }`}
                          >
                            {isGain ? '+' : ''}
                            {entry.amount}
                          </span>
                          <span className="truncate text-foreground/90">
                            {entry.awarded_by_name}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-[10px] shrink-0">
                          {formatDate(entry.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              {t.common?.cancel || 'Fechar'}
            </Button>
            {currentXp > 0 && (
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!isValid || !confirmed || saving}
              >
                {saving
                  ? t.common?.saving || 'Salvando...'
                  : t.xpReducer?.confirm || 'Usar XP'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
