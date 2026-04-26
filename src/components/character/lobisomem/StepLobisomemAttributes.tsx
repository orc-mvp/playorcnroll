import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import DotRating from '@/components/character/vampiro/DotRating';
import { LobisomemFormData } from './StepLobisomemBasicInfo';
import { STORYTELLER_ATTRIBUTES as ATTRIBUTES, STORYTELLER_ABILITIES as ABILITIES } from '@/lib/storyteller/traits';

interface StepLobisomemAttributesProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
}

type AttributeCategory = 'physical' | 'social' | 'mental';
type AbilityCategory = 'talents' | 'skills' | 'knowledges';

export default function StepLobisomemAttributes({ formData, updateFormData }: StepLobisomemAttributesProps) {
  const { language } = useI18n();
  const isMobile = useIsMobile();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    physical: true, social: true, mental: true,
    talents: true, skills: true, knowledges: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateAttribute = (category: AttributeCategory, key: string, value: number) => {
    updateFormData({
      attributes: {
        ...formData.attributes,
        [category]: { ...formData.attributes[category], [key]: value },
      },
    });
  };

  const updateAbility = (category: AbilityCategory, key: string, value: number) => {
    updateFormData({
      abilities: {
        ...formData.abilities,
        [category]: { ...formData.abilities[category], [key]: value },
      },
    });
    if (value < 4 && formData.specializations[key]) {
      const newSpec = { ...formData.specializations };
      delete newSpec[key];
      updateFormData({ specializations: newSpec });
    }
  };

  const updateSpecialization = (key: string, value: string) => {
    updateFormData({ specializations: { ...formData.specializations, [key]: value } });
  };

  const renderAttributeSection = (category: AttributeCategory) => {
    const section = ATTRIBUTES[category];
    const content = (
      <div className="space-y-2">
        {section.items.map((attr) => (
          <div key={attr.key} className="flex items-center justify-between gap-2">
            <span className="text-sm font-body min-w-[100px]">
              {attr.label[language as 'pt-BR' | 'en-US']}
            </span>
            <DotRating
              value={formData.attributes[category][attr.key as keyof typeof formData.attributes.physical]}
              onChange={(value) => updateAttribute(category, attr.key, value)}
              minValue={1}
            />
          </div>
        ))}
      </div>
    );

    if (isMobile) {
      return (
        <Collapsible open={openSections[category]} onOpenChange={() => toggleSection(category)}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
            <span className="font-medieval text-sm">{section.label[language as 'pt-BR' | 'en-US']}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections[category] ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 px-1">{content}</CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-medieval text-sm text-center border-b border-border pb-1">
          {section.label[language as 'pt-BR' | 'en-US']}
        </h4>
        {content}
      </div>
    );
  };

  const getAbilityCategoryTotal = (category: AbilityCategory) => {
    return ABILITIES[category].items.reduce((sum, item) => sum + (formData.abilities[category][item.key] || 0), 0);
  };

  const renderAbilitySection = (category: AbilityCategory) => {
    const section = ABILITIES[category];
    const content = (
      <div className="space-y-2">
        {section.items.map((ability) => {
          const abilityValue = formData.abilities[category][ability.key] || 0;
          const showSpecialization = abilityValue >= 4;
          return (
            <div key={ability.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-body min-w-[100px]">
                  {ability.label[language as 'pt-BR' | 'en-US']}
                </span>
                <DotRating
                  value={abilityValue}
                  onChange={(value) => updateAbility(category, ability.key, value)}
                  minValue={0}
                />
              </div>
              {showSpecialization && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    value={formData.specializations[ability.key] || ''}
                    onChange={(e) => updateSpecialization(ability.key, e.target.value)}
                    placeholder={language === 'pt-BR' ? 'Especialização...' : 'Specialization...'}
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
        <Collapsible open={openSections[category]} onOpenChange={() => toggleSection(category)}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
            <span className="font-medieval text-sm">
              {section.label[language as 'pt-BR' | 'en-US']}{' '}
              <span className="text-muted-foreground/60">({getAbilityCategoryTotal(category)})</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections[category] ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 px-1">{content}</CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-medieval text-sm text-center border-b border-border pb-1">
          {section.label[language as 'pt-BR' | 'en-US']}{' '}
          <span className="text-muted-foreground/60">({getAbilityCategoryTotal(category)})</span>
        </h4>
        {content}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="medieval-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-medieval text-xl text-center">
            {language === 'pt-BR' ? 'Atributos' : 'Attributes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderAttributeSection('physical')}
            {renderAttributeSection('social')}
            {renderAttributeSection('mental')}
          </div>
        </CardContent>
      </Card>

      <Card className="medieval-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-medieval text-xl text-center">
            {language === 'pt-BR' ? 'Habilidades' : 'Abilities'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderAbilitySection('talents')}
            {renderAbilitySection('skills')}
            {renderAbilitySection('knowledges')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
