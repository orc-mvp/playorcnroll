import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Dog, AlertTriangle, ArrowRight } from 'lucide-react';

const FORMS = ['hominid', 'glabro', 'crinos', 'hispo', 'lupus'] as const;

interface FormModifiers {
  strength?: number;
  dexterity?: number;
  stamina?: number;
  appearance?: number | string;
  manipulation?: number;
  difficulty: number;
  special?: string;
}

const FORM_DATA: Record<string, FormModifiers> = {
  hominid: { difficulty: 6 },
  glabro: { strength: 2, stamina: 2, appearance: -1, manipulation: -1, difficulty: 7 },
  crinos: { strength: 4, dexterity: 1, stamina: 3, appearance: '0', manipulation: -3, difficulty: 6, special: 'delirium' },
  hispo: { strength: 3, dexterity: 2, stamina: 3, manipulation: -3, difficulty: 7 },
  lupus: { strength: 1, dexterity: 2, stamina: 2, manipulation: -3, difficulty: 6 },
};

interface FormChangeModalProps {
  open: boolean;
  currentForm: string;
  onConfirm: (form: string) => void;
  onCancel: () => void;
}

export function FormChangeModal({ open, currentForm, onConfirm, onCancel }: FormChangeModalProps) {
  const t = useTranslation();
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  const getFormLabel = (form: string) => {
    const key = `form_${form}` as keyof typeof t.lobisomem;
    return (t.lobisomem as any)?.[key] || form;
  };

  const formatModifier = (val: number | string | undefined) => {
    if (val === undefined) return null;
    if (typeof val === 'string') return val;
    return val > 0 ? `+${val}` : `${val}`;
  };

  const handleSelect = (form: string) => {
    if (form === currentForm) return;
    setSelectedForm(form);
    setConfirmStep(false);
  };

  const handleFirstConfirm = () => {
    setConfirmStep(true);
  };

  const handleFinalConfirm = () => {
    if (selectedForm) {
      onConfirm(selectedForm);
    }
    setSelectedForm(null);
    setConfirmStep(false);
  };

  const handleClose = () => {
    setSelectedForm(null);
    setConfirmStep(false);
    onCancel();
  };

  const attrLabels: Record<string, string> = {
    strength: t.lobisomem?.formAttrStrength || 'Força',
    dexterity: t.lobisomem?.formAttrDexterity || 'Destreza',
    stamina: t.lobisomem?.formAttrStamina || 'Vigor',
    appearance: t.lobisomem?.formAttrAppearance || 'Aparência',
    manipulation: t.lobisomem?.formAttrManipulation || 'Manipulação',
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dog className="w-5 h-5 text-emerald-500" />
            {t.lobisomem?.changeForm || 'Mudar Forma'}
          </DialogTitle>
          <DialogDescription>
            {t.lobisomem?.currentFormLabel || 'Forma atual'}: <strong>{getFormLabel(currentForm)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {FORMS.map((form) => {
            const data = FORM_DATA[form];
            const isActive = form === currentForm;
            const isSelected = form === selectedForm;
            const modifiers = ['strength', 'dexterity', 'stamina', 'appearance', 'manipulation']
              .filter((attr) => (data as any)[attr] !== undefined)
              .map((attr) => ({ attr, label: attrLabels[attr], value: formatModifier((data as any)[attr]) }));

            return (
              <button
                key={form}
                type="button"
                disabled={isActive}
                onClick={() => handleSelect(form)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/40 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medieval text-sm">{getFormLabel(form)}</span>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                        {t.lobisomem?.activeForm || 'Ativa'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {t.lobisomem?.formDifficulty || 'Dificuldade'}: {data.difficulty}
                    </Badge>
                  </div>
                </div>

                {modifiers.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {modifiers.map(({ attr, label, value }) => (
                      <Badge
                        key={attr}
                        variant="secondary"
                        className={`text-[10px] ${
                          typeof value === 'string' && value.startsWith('+')
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : typeof value === 'string' && value.startsWith('-')
                            ? 'text-destructive'
                            : ''
                        }`}
                      >
                        {label}: {value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t.lobisomem?.noModifiers || 'Nenhuma alteração nos atributos.'}
                  </p>
                )}

                {data.special === 'delirium' && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-500">
                    <AlertTriangle className="w-3 h-3" />
                    {t.lobisomem?.formDeliriumWarning || 'Induz o Delírio em seres humanos.'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirmation area */}
        {selectedForm && !confirmStep && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{getFormLabel(currentForm)}</span>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
              <span className="font-medieval text-emerald-500">{getFormLabel(selectedForm)}</span>
            </div>
            <Button onClick={handleFirstConfirm} className="bg-emerald-500 hover:bg-emerald-600">
              {t.lobisomem?.confirmTransformation || 'Transformar'}
            </Button>
          </div>
        )}

        {selectedForm && confirmStep && (
          <div className="pt-2 border-t border-destructive/30 space-y-2">
            <div className="flex items-center gap-2 text-sm text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              {t.lobisomem?.confirmTransformationWarning || 'Tem certeza que deseja se transformar?'}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmStep(false)}>
                {t.common?.cancel || 'Cancelar'}
              </Button>
              <Button onClick={handleFinalConfirm} variant="destructive">
                {t.lobisomem?.confirmYesTransform || 'Sim, transformar!'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
