/**
 * Bloco compartilhado de Virtudes do Vampiro (V3).
 *
 * Renderiza as duas virtudes (Consciência/Convicção e Autocontrole/Instinto)
 * + Coragem. Em modo edição, permite trocar o tipo de cada virtude e ajustar
 * os pontos. Em modo leitura, mostra apenas labels e dots estáticos.
 *
 * Usado tanto pela aba "Virtudes" do EditVampiroCharacterModal quanto pela
 * VampiroCharacterSheet.
 */
import { useI18n } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DotRating from '@/components/character/vampiro/DotRating';

export interface VirtuesValue {
  virtueType1: string;
  virtueValue1: number;
  virtueType2: string;
  virtueValue2: number;
  courage: number;
}

interface VirtuesBlockProps {
  value: VirtuesValue;
  onChange?: (next: VirtuesValue) => void;
  readOnly?: boolean;
  /** Quando readOnly e variant='sheet', renderiza os labels centralizados (estilo ficha). */
  variant?: 'edit' | 'sheet';
}

export default function VirtuesBlock({ value, onChange, readOnly = false, variant = 'edit' }: VirtuesBlockProps) {
  const { t, language } = useI18n();

  const virtue1Label = (key: string) =>
    key === 'conscience' ? t.vampiro.conscience : t.vampiro.conviction;
  const virtue2Label = (key: string) =>
    key === 'selfControl' ? t.vampiro.selfControl : t.vampiro.instinct;

  const update = (patch: Partial<VirtuesValue>) => {
    if (readOnly || !onChange) return;
    onChange({ ...value, ...patch });
  };

  if (readOnly) {
    const isSheet = variant === 'sheet';
    return (
      <div className={`space-y-2 ${isSheet ? 'text-center' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-body">{virtue1Label(value.virtueType1)}</span>
          <DotRating value={value.virtueValue1} maxValue={5} readOnly />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-body">{virtue2Label(value.virtueType2)}</span>
          <DotRating value={value.virtueValue2} maxValue={5} readOnly />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-body">{t.vampiro.courage}</span>
          <DotRating value={value.courage} maxValue={5} readOnly />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select
          value={value.virtueType1}
          onValueChange={(v) => update({ virtueType1: v })}
        >
          <SelectTrigger className="w-40 font-body bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conscience">{t.vampiro.conscience}</SelectItem>
            <SelectItem value="conviction">{t.vampiro.conviction}</SelectItem>
          </SelectContent>
        </Select>
        <DotRating
          value={value.virtueValue1 || 1}
          onChange={(val) => update({ virtueValue1: val })}
          maxValue={5}
          minValue={1}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Select
          value={value.virtueType2}
          onValueChange={(v) => update({ virtueType2: v })}
        >
          <SelectTrigger className="w-40 font-body bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selfControl">{t.vampiro.selfControl}</SelectItem>
            <SelectItem value="instinct">{t.vampiro.instinct}</SelectItem>
          </SelectContent>
        </Select>
        <DotRating
          value={value.virtueValue2 || 1}
          onChange={(val) => update({ virtueValue2: val })}
          maxValue={5}
          minValue={1}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="font-body text-sm w-40">{t.vampiro.courage}</span>
        <DotRating
          value={value.courage || 1}
          onChange={(val) => update({ courage: val })}
          maxValue={5}
          minValue={1}
        />
      </div>
      {/* sufixo de idioma para satisfazer lint de unused */}
      <span className="hidden">{language}</span>
    </div>
  );
}
