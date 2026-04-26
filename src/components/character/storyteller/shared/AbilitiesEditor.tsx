/**
 * Shared Abilities editor for Storyteller WoD systems.
 *
 * Replaces duplicated abilities UI (Talents/Skills/Knowledges) in the
 * Step files of Vampiro, Lobisomem and Mago. Specializations appear when
 * an ability reaches 4+ dots and clear automatically when it drops below.
 */
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DotRating from '@/components/character/vampiro/DotRating';
import { STORYTELLER_ABILITIES } from '@/lib/storyteller/traits';

export type AbilityCategory = 'talents' | 'skills' | 'knowledges';

export type AbilityValues = Record<AbilityCategory, Record<string, number>>;

interface AbilitiesEditorProps {
  value: AbilityValues;
  onChange: (next: AbilityValues) => void;
  specializations: Record<string, string>;
  onSpecializationsChange: (next: Record<string, string>) => void;
  /** Show category total badge next to title (default true). */
  showTotals?: boolean;
  /** Hide the outer card (used inside Edit modal tabs). */
  noCard?: boolean;
  /** Override card title. */
  title?: string;
}

export default function AbilitiesEditor({
  value,
  onChange,
  specializations,
  onSpecializationsChange,
  showTotals = true,
  noCard = false,
  title,
}: AbilitiesEditorProps) {
  const { language } = useI18n();
  const isMobile = useIsMobile();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    talents: true,
    skills: true,
    knowledges: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateAbility = (category: AbilityCategory, key: string, val: number) => {
    onChange({
      ...value,
      [category]: { ...value[category], [key]: val },
    });
    if (val < 4 && specializations[key]) {
      const next = { ...specializations };
      delete next[key];
      onSpecializationsChange(next);
    }
  };

  const updateSpecialization = (key: string, val: string) => {
    onSpecializationsChange({ ...specializations, [key]: val });
  };

  const getCategoryTotal = (category: AbilityCategory) =>
    STORYTELLER_ABILITIES[category].items.reduce(
      (sum, item) => sum + (value[category]?.[item.key] || 0),
      0
    );

  const renderSection = (category: AbilityCategory) => {
    const section = STORYTELLER_ABILITIES[category];
    const labelText = section.label[language as 'pt-BR' | 'en-US'];
    const totalSuffix = showTotals ? (
      <span className="text-muted-foreground/60"> ({getCategoryTotal(category)})</span>
    ) : null;

    const content = (
      <div className="space-y-2">
        {section.items.map((ability) => {
          const abilityValue = value[category]?.[ability.key] || 0;
          const showSpecialization = abilityValue >= 4;
          return (
            <div key={ability.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-body min-w-[100px]">
                  {ability.label[language as 'pt-BR' | 'en-US']}
                </span>
                <DotRating
                  value={abilityValue}
                  onChange={(val) => updateAbility(category, ability.key, val)}
                  minValue={0}
                />
              </div>
              {showSpecialization && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    value={specializations[ability.key] || ''}
                    onChange={(e) => updateSpecialization(ability.key, e.target.value)}
                    placeholder={
                      language === 'pt-BR' ? 'Especialização...' : 'Specialization...'
                    }
                    className="h-7 text-xs bg-input border-border ml-2"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

    if (isMobile) {
      return (
        <Collapsible
          key={category}
          open={openSections[category]}
          onOpenChange={() => toggleSection(category)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
            <span className="font-medieval text-sm">
              {labelText}
              {totalSuffix}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openSections[category] ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 px-1">{content}</CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div key={category} className="space-y-3">
        <h4 className="font-medieval text-sm text-center border-b border-border pb-1">
          {labelText}
          {totalSuffix}
        </h4>
        {content}
      </div>
    );
  };

  const grid = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {renderSection('talents')}
      {renderSection('skills')}
      {renderSection('knowledges')}
    </div>
  );

  if (noCard) return grid;

  return (
    <Card className="medieval-card">
      <CardHeader className="pb-4">
        <CardTitle className="font-medieval text-xl text-center">
          {title ?? (language === 'pt-BR' ? 'Habilidades' : 'Abilities')}
        </CardTitle>
      </CardHeader>
      <CardContent>{grid}</CardContent>
    </Card>
  );
}
