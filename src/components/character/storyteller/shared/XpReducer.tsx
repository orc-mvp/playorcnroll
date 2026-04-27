/**
 * XpReducer — botão para o jogador reduzir seu próprio pool global de XP
 * com dupla confirmação. Atualiza characters.experience_points em tempo real.
 *
 * Usado dentro das fichas WoD (Vampiro, Lobisomem, Mago, Metamorfos) e na
 * página /character/:id, sempre que o usuário logado é o dono do personagem.
 */

import { useState } from 'react';
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
import { Minus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';

interface XpReducerProps {
  characterId: string;
  currentXp: number;
}

export function XpReducer({ characterId, currentXp }: XpReducerProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsed = Number.parseInt(amount, 10);
  const isValid =
    Number.isFinite(parsed) && parsed > 0 && parsed <= currentXp;

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
      toast({
        title: t.xpReducer?.successTitle || 'XP atualizado',
        description: (t.xpReducer?.successDescription || 'Foram gastos {n} XP.').replace(
          '{n}',
          String(parsed),
        ),
      });
      setOpen(false);
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

  if (currentXp <= 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Minus className="w-3.5 h-3.5" />
        {t.xpReducer?.spendXp || 'Usar XP'}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              {t.xpReducer?.title || 'Gastar Experiência'}
            </DialogTitle>
            <DialogDescription className="font-body">
              {t.xpReducer?.description ||
                'Esta ação reduz seu pool de XP permanentemente. Confirme com cuidado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm font-body">
              <span className="text-muted-foreground">
                {t.xpReducer?.currentXp || 'XP atual'}:
              </span>{' '}
              <span className="font-mono font-bold">{currentXp}</span>
            </div>

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
                autoFocus
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
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              {t.common?.cancel || 'Cancelar'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValid || !confirmed || saving}
            >
              {saving
                ? t.common?.saving || 'Salvando...'
                : t.xpReducer?.confirm || 'Usar XP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
