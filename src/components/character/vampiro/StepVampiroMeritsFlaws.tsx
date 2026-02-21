import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Loader2 } from 'lucide-react';
import { VampiroFormData } from './StepVampiroBasicInfo';
import { toTitleCase } from '@/lib/textUtils';

interface MeritFlawItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  prerequisites: string | null;
  sourcebook: string | null;
  game_systems: string[];
}

interface StepVampiroMeritsFlawsProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

export default function StepVampiroMeritsFlaws({ formData, updateFormData }: StepVampiroMeritsFlawsProps) {
  const { t, language } = useI18n();
  const [available, setAvailable] = useState<MeritFlawItem[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = formData.merits_flaws || [];

  useEffect(() => {
    const fetchMeritsFlaws = async () => {
      const { data, error } = await supabase
        .from('merits_flaws')
        .select('*')
        .contains('game_systems', ['vampiro_v3'])
        .order('category')
        .order('cost', { ascending: false })
        .order('name');

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching merits/flaws:', error);
      } else {
        setAvailable((data as MeritFlawItem[]) || []);
      }
      setLoading(false);
    };

    fetchMeritsFlaws();
  }, []);

  const toggleItem = (item: MeritFlawItem) => {
    const isSelected = selected.some((s) => s.id === item.id);
    const updated = isSelected
      ? selected.filter((s) => s.id !== item.id)
      : [...selected, { id: item.id, name: item.name, cost: item.cost, category: item.category }];
    updateFormData({ merits_flaws: updated });
  };

  const totalCost = selected.reduce((sum, s) => sum + s.cost, 0);
  const freebiePoints = 15;
  const remaining = freebiePoints - totalCost;

  const categoryLabel = (cat: string) =>
    (t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string) || cat;

  // Group by category
  const grouped = available.reduce<Record<string, MeritFlawItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {t.meritsFlaws.title}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Selecione vantagens e desvantagens para seu personagem (opcional)'
              : 'Select merits and flaws for your character (optional)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Points summary */}
          <div className="flex items-center justify-center gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-border">
            <span className="font-medieval text-sm">
              {t.meritsFlaws.freebiePoints}:
            </span>
            <Badge
              variant="outline"
              className={
                remaining >= 0
                  ? 'border-green-500/50 text-green-500'
                  : 'border-red-500/50 text-red-500'
              }
            >
              {remaining} {t.meritsFlaws.freebieRemaining} ({t.meritsFlaws.freebieTotal} {freebiePoints})
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({selected.length} {language === 'pt-BR' ? 'selecionado(s)' : 'selected'})
            </span>
          </div>

          {available.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body">
              {language === 'pt-BR'
                ? 'Nenhuma vantagem ou desvantagem disponível. O Narrador pode cadastrá-las em Personalização.'
                : 'No merits or flaws available. The Narrator can register them in Customization.'}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-medieval text-sm text-muted-foreground mb-2">
                      {categoryLabel(category)}
                    </h4>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const isChecked = selected.some((s) => s.id === item.id);
                        const isMerit = item.cost > 0;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                              isChecked
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border hover:bg-muted/30'
                            }`}
                            onClick={() => toggleItem(item)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleItem(item)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medieval text-sm">{toTitleCase(item.name)}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    isMerit
                                      ? 'border-green-500/50 text-green-500'
                                      : 'border-red-500/50 text-red-500'
                                  }`}
                                >
                                  {isMerit ? '+' : ''}{item.cost} {t.meritsFlaws.points}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">
                                {item.description}
                              </p>
                              {item.prerequisites && (
                                <p className="text-xs text-muted-foreground/70 font-body italic mt-1">
                                  {t.meritsFlaws.prerequisites}: {item.prerequisites}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
