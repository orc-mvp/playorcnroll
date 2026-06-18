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
}

export default function RenownBlock({ value, onChange, tribe, readOnly = false }: RenownBlockProps) {
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
          value={value.glory || 0}
          onChange={(val) => update({ glory: val })}
          maxValue={10}
          minValue={0}
          readOnly={readOnly}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-body text-sm">{honorLabel}</span>
        <DotRating
          value={value.honor || 0}
          onChange={(val) => update({ honor: val })}
          maxValue={10}
          minValue={0}
          readOnly={readOnly}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-body text-sm">{wisdomLabel}</span>
        <DotRating
          value={value.wisdom || 0}
          onChange={(val) => update({ wisdom: val })}
          maxValue={10}
          minValue={0}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
