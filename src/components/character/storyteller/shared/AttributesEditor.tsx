/**
 * Shared Attributes editor for Storyteller WoD systems
 * (Vampiro, Lobisomem, Mago, Metamorfos).
 *
 * Replaces duplicated attribute UI in StepVampiroAttributes,
 * StepLobisomemAttributes, StepMagoAttributes.
 */
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DotRating from '@/components/character/vampiro/DotRating';
import { STORYTELLER_ATTRIBUTES } from '@/lib/storyteller/traits';

export type AttributeCategory = 'physical' | 'social' | 'mental';

export type AttributeValues = Record<AttributeCategory, Record<string, number>>;

interface AttributesEditorProps {
  value: AttributeValues;
  onChange: (next: AttributeValues) => void;
  /** Minimum value per attribute (default 1 — WoD). */
  minValue?: number;
  /** Maximum dots displayed (default 5). */
  maxValue?: number;
  /** Show category total badge next to title. */
  showTotals?: boolean;
  /** Subtract this from displayed total per category (e.g. -3 for "spent points"). */
  totalOffset?: number;
  /** Hide the outer card (used inside Edit modal tabs). */
  noCard?: boolean;
  /** Override card title. */
  title?: string;
}

export default function AttributesEditor({
  value,
  onChange,
  minValue = 1,
  maxValue = 5,
  showTotals = false,
  totalOffset = 0,
  noCard = false,
  title,
}: AttributesEditorProps) {
  const { language } = useI18n();
  const isMobile = useIsMobile();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    physical: true,
    social: true,
    mental: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateAttribute = (category: AttributeCategory, key: string, val: number) => {
    onChange({
      ...value,
      [category]: { ...value[category], [key]: val },
    });
  };

  const getCategoryTotal = (category: AttributeCategory) =>
    Object.values(value[category] || {}).reduce((s, v) => s + (Number(v) || 0), 0) + totalOffset;

  const renderSection = (category: AttributeCategory) => {
    const section = STORYTELLER_ATTRIBUTES[category];
    const labelText = section.label[language as 'pt-BR' | 'en-US'];
    const totalSuffix = showTotals ? (
      <span className="text-muted-foreground/60"> ({getCategoryTotal(category)})</span>
    ) : null;

    const content = (
      <div className="space-y-2">
        {section.items.map((attr) => (
          <div key={attr.key} className="flex items-center justify-between gap-2">
            <span className="text-sm font-body min-w-[100px]">
              {attr.label[language as 'pt-BR' | 'en-US']}
            </span>
            <DotRating
              value={value[category]?.[attr.key] ?? minValue}
              onChange={(val) => updateAttribute(category, attr.key, val)}
              minValue={minValue}
              maxValue={maxValue}
            />
          </div>
        ))}
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
      {renderSection('physical')}
      {renderSection('social')}
      {renderSection('mental')}
    </div>
  );

  if (noCard) return grid;

  return (
    <Card className="medieval-card">
      <CardHeader className="pb-4">
        <CardTitle className="font-medieval text-xl text-center">
          {title ?? (language === 'pt-BR' ? 'Atributos' : 'Attributes')}
        </CardTitle>
      </CardHeader>
      <CardContent>{grid}</CardContent>
    </Card>
  );
}
