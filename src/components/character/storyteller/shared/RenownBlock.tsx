/**
 * Bloco compartilhado de Renome (Lobisomem W20 / Metamorfos).
 *
 * Renderiza Glória/Honra/Sabedoria com labels alternativos quando a tribo é
 * "Black Spiral Dancers" (Infâmia/Astúcia/Desonra na tradução local).
 * Usado pela aba "Antecedentes" do EditLobisomemCharacterModal e pela
 * LobisomemCharacterSheet.
 */
import { useI18n } from '@/lib/i18n';
import DotRating from '@/components/character/vampiro/DotRating';

export interface RenownValue {
  glory: number;
  honor: number;
  wisdom: number;
}

interface RenownBlockProps {
  value: RenownValue;
  onChange?: (next: RenownValue) => void;
  /** Tribo do personagem — controla rename para Black Spiral Dancers. */
  tribe?: string;
  readOnly?: boolean;
  /** Máximo dos dots (W20=10, W5=5). Default 10. */
  maxValue?: number;
}

export default function RenownBlock({ value, onChange, tribe, readOnly = false, maxValue = 10 }: RenownBlockProps) {
  const { t } = useI18n();
  const isBSD = tribe === 'Black Spiral Dancers';
  const gloryLabel = isBSD ? t.lobisomem.bsd_glory : t.lobisomem.glory;
  const honorLabel = isBSD ? t.lobisomem.bsd_honor : t.lobisomem.honor;
  const wisdomLabel = isBSD ? t.lobisomem.bsd_wisdom : t.lobisomem.wisdom;

  const update = (patch: Partial<RenownValue>) => {
    if (readOnly || !onChange) return;
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm">{gloryLabel}</span>
        <DotRating
          value={Math.min(value.glory || 0, maxValue)}
          onChange={(val) => update({ glory: val })}
          maxValue={maxValue}
          minValue={0}
          readOnly={readOnly}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-body text-sm">{honorLabel}</span>
        <DotRating
          value={Math.min(value.honor || 0, maxValue)}
          onChange={(val) => update({ honor: val })}
          maxValue={maxValue}
          minValue={0}
          readOnly={readOnly}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-body text-sm">{wisdomLabel}</span>
        <DotRating
          value={Math.min(value.wisdom || 0, maxValue)}
          onChange={(val) => update({ wisdom: val })}
          maxValue={maxValue}
          minValue={0}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
