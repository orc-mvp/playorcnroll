import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, X } from 'lucide-react';
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
  gameSystem: MeritsFlawsSystemKey;
  selected: SelectedMeritFlaw[];
  onChange: (next: SelectedMeritFlaw[]) => void;
  freebieBudget?: number;
  variant?: 'creation' | 'edit';
  accent?: 'primary' | 'amber';
  onAvailableLoaded?: (available: MeritFlawItem[]) => void;
}

type TypeFilter = 'all' | 'merit' | 'flaw' | 'selected';

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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

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

  const toggleItem = (item: Pick<MeritFlawItem, 'id' | 'name' | 'cost' | 'category'>) => {
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    available.forEach((i) => set.add(i.category));
    return Array.from(set).sort();
  }, [available]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const selectedIds = new Set(selected.map((s) => s.id));
    return available.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (typeFilter === 'merit' && item.cost <= 0) return false;
      if (typeFilter === 'flaw' && item.cost >= 0) return false;
      if (typeFilter === 'selected' && !selectedIds.has(item.id)) return false;
      if (normalizedSearch) {
        const hay = `${item.name} ${item.description} ${item.prerequisites ?? ''}`.toLowerCase();
        if (!hay.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [available, categoryFilter, typeFilter, normalizedSearch, selected]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, MeritFlawItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const hasActiveFilters =
    normalizedSearch.length > 0 || categoryFilter !== 'all' || typeFilter !== 'all';


  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

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

  const noResults = (
    <div className="text-center py-6 text-muted-foreground font-body text-sm">
      {t.meritsFlaws.noResults}
    </div>
  );




  const shownText = t.meritsFlaws.shownCount
    .replace('{shown}', String(filtered.length))
    .replace('{total}', String(available.length));

  const controls = available.length > 0 && (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.meritsFlaws.searchPlaceholder}
          className={`pl-8 ${isCompact ? 'h-8 text-xs' : 'h-9 text-sm'}`}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className={isCompact ? 'h-8 text-xs' : 'h-9 text-sm'}>
            <SelectValue placeholder={t.meritsFlaws.filterByCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.meritsFlaws.allCategories}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TypeFilter)}
        >
          <SelectTrigger className={isCompact ? 'h-8 text-xs' : 'h-9 text-sm'}>
            <SelectValue placeholder={t.meritsFlaws.filterByType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.meritsFlaws.allTypes}</SelectItem>
            <SelectItem value="merit">{t.meritsFlaws.meritsOnly}</SelectItem>
            <SelectItem value="flaw">{t.meritsFlaws.flawsOnly}</SelectItem>
            <SelectItem value="selected" disabled={selected.length === 0}>
              {t.meritsFlaws.selectedOnly} ({selected.length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground font-body">
        <span>{shownText}</span>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            {t.meritsFlaws.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );

  const selectedHiddenBlock = selectedHiddenItems.length > 0 && (
    <div className="space-y-2">
      <h4 className="font-medieval text-xs text-muted-foreground">
        {t.meritsFlaws.selectedHeader}
      </h4>
      <div className="space-y-2">{selectedHiddenItems.map(renderItem)}</div>
    </div>
  );

  const listBlock =
    filtered.length === 0 ? (
      noResults
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
            {t.meritsFlaws.freebieTotal} {freebieBudget})
          </Badge>
        </div>
      )}

      {available.length === 0 ? (
        empty
      ) : (
        <>
          {controls}
          {selectedHiddenBlock}
          {listBlock}
        </>
      )}
    </div>
  );
}
