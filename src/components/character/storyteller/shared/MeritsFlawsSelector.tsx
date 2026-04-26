import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toTitleCase } from '@/lib/textUtils';

export interface SelectedMeritFlaw {
  id: string;
  name: string;
  cost: number;
  category: string;
}

interface MeritFlawItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  prerequisites: string | null;
  sourcebook?: string | null;
  game_systems?: string[];
}

export type MeritsFlawsSystemKey =
  | 'vampiro_v3'
  | 'lobisomem_w20'
  | 'mago_m20';

interface MeritsFlawsSelectorProps {
  /** Sistema do personagem — filtra a lista do banco. */
  gameSystem: MeritsFlawsSystemKey;
  /** M&F atualmente selecionadas. */
  selected: SelectedMeritFlaw[];
  /** Callback chamado a cada alteração na seleção. */
  onChange: (next: SelectedMeritFlaw[]) => void;
  /** Quando informado, exibe contador de pontos livres restantes. */
  freebieBudget?: number;
  /**
   * `creation` exibe scroll alto (~400px) com cards grandes e descrição expandida.
   * `edit` é compacto, sem ScrollArea (o pai já controla o overflow).
   */
  variant?: 'creation' | 'edit';
  /** Cor de destaque do item selecionado. Padrão: 'primary'. */
  accent?: 'primary' | 'amber';
  /** Já notificadas como removidas pela limpeza automática (opcional). */
  onAvailableLoaded?: (available: MeritFlawItem[]) => void;
}

export default function MeritsFlawsSelector({
  gameSystem,
  selected,
  onChange,
  freebieBudget,
  variant = 'creation',
  accent = 'primary',
  onAvailableLoaded,
}: MeritsFlawsSelectorProps) {
  const { t, language } = useI18n();
  const [available, setAvailable] = useState<MeritFlawItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('merits_flaws')
        .select('id, name, description, cost, category, prerequisites, sourcebook, game_systems')
        .contains('game_systems', [gameSystem])
        .order('category')
        .order('cost', { ascending: false })
        .order('name');

      if (cancelled) return;
      if (error) {
        if (import.meta.env.DEV) console.error('[MeritsFlawsSelector] fetch error', error);
      } else {
        const list = (data as MeritFlawItem[]) || [];
        setAvailable(list);
        onAvailableLoaded?.(list);
      }
      setLoading(false);
    };
    fetchItems();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSystem]);

  const toggleItem = (item: MeritFlawItem) => {
    const isSelected = selected.some((s) => s.id === item.id);
    const next = isSelected
      ? selected.filter((s) => s.id !== item.id)
      : [
          ...selected,
          { id: item.id, name: item.name, cost: item.cost, category: item.category },
        ];
    onChange(next);
  };

  const totalCost = useMemo(
    () => selected.reduce((sum, s) => sum + s.cost, 0),
    [selected],
  );
  const remaining =
    typeof freebieBudget === 'number' ? freebieBudget - totalCost : null;

  const categoryLabel = (cat: string) =>
    (t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string) || cat;

  const grouped = useMemo(() => {
    return available.reduce<Record<string, MeritFlawItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [available]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const accentSelected =
    accent === 'amber'
      ? 'border-amber-500/50 bg-amber-500/5'
      : 'border-primary/50 bg-primary/5';

  const isCompact = variant === 'edit';

  const renderItem = (item: MeritFlawItem) => {
    const isChecked = selected.some((s) => s.id === item.id);
    const isMerit = item.cost > 0;
    return (
      <div
        key={item.id}
        className={`flex items-start gap-${isCompact ? '2' : '3'} p-${isCompact ? '2' : '3'} rounded-lg border cursor-pointer transition-colors ${
          isChecked ? accentSelected : 'border-border hover:bg-muted/30'
        }`}
        onClick={() => toggleItem(item)}
      >
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => toggleItem(item)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-medieval ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {toTitleCase(item.name)}
            </span>
            <Badge
              variant="outline"
              className={`${isCompact ? 'text-[10px]' : 'text-xs'} ${
                isMerit
                  ? 'border-green-500/50 text-green-500'
                  : 'border-red-500/50 text-red-500'
              }`}
            >
              {isMerit ? '+' : ''}
              {item.cost}
              {isCompact ? '' : ` ${t.meritsFlaws.points}`}
            </Badge>
            {isCompact && (
              <Badge variant="secondary" className="text-[10px]">
                {categoryLabel(item.category)}
              </Badge>
            )}
          </div>
          <p
            className={`${isCompact ? 'text-[11px] mt-0.5 line-clamp-1' : 'text-xs mt-1 line-clamp-2'} text-muted-foreground font-body`}
          >
            {item.description}
          </p>
          {!isCompact && item.prerequisites && (
            <p className="text-xs text-muted-foreground/70 font-body italic mt-1">
              {t.meritsFlaws.prerequisites}: {item.prerequisites}
            </p>
          )}
        </div>
      </div>
    );
  };

  const empty = (
    <div className="text-center py-6 text-muted-foreground font-body text-sm">
      {language === 'pt-BR'
        ? 'Nenhuma vantagem ou desvantagem disponível. O Narrador pode cadastrá-las em Personalização.'
        : 'No merits or flaws available. The Narrator can register them in Customization.'}
    </div>
  );

  return (
    <div className="space-y-3">
      {remaining !== null && (
        <div className="flex items-center justify-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
          <span className={`font-medieval ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {t.meritsFlaws.freebiePoints}:
          </span>
          <Badge
            variant="outline"
            className={`${isCompact ? 'text-xs' : ''} ${
              remaining >= 0
                ? 'border-green-500/50 text-green-500'
                : 'border-red-500/50 text-red-500'
            }`}
          >
            {remaining} {t.meritsFlaws.freebieRemaining} (
            {t.meritsFlaws.freebieTotal} {freebiePoints ?? freebieBudget})
          </Badge>
        </div>
      )}

      {available.length === 0 ? (
        empty
      ) : isCompact ? (
        <div className="space-y-2">
          {Object.entries(grouped).flatMap(([, items]) => items.map(renderItem))}
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2">
                  {categoryLabel(category)}
                </h4>
                <div className="space-y-2">{items.map(renderItem)}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Used internally so we can reference `freebieBudget` cleanly in the badge text
const freebiePoints: number | undefined = undefined;
