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

const ATTRIBUTES = {
  physical: {
    label: { 'pt-BR': 'Físicos', 'en-US': 'Physical' },
    items: [
      { key: 'strength', label: { 'pt-BR': 'Força', 'en-US': 'Strength' } },
      { key: 'dexterity', label: { 'pt-BR': 'Destreza', 'en-US': 'Dexterity' } },
      { key: 'stamina', label: { 'pt-BR': 'Vigor', 'en-US': 'Stamina' } },
    ],
  },
  social: {
    label: { 'pt-BR': 'Sociais', 'en-US': 'Social' },
    items: [
      { key: 'charisma', label: { 'pt-BR': 'Carisma', 'en-US': 'Charisma' } },
      { key: 'manipulation', label: { 'pt-BR': 'Manipulação', 'en-US': 'Manipulation' } },
      { key: 'appearance', label: { 'pt-BR': 'Aparência', 'en-US': 'Appearance' } },
    ],
  },
  mental: {
    label: { 'pt-BR': 'Mentais', 'en-US': 'Mental' },
    items: [
      { key: 'perception', label: { 'pt-BR': 'Percepção', 'en-US': 'Perception' } },
      { key: 'intelligence', label: { 'pt-BR': 'Inteligência', 'en-US': 'Intelligence' } },
      { key: 'wits', label: { 'pt-BR': 'Raciocínio', 'en-US': 'Wits' } },
    ],
  },
};

const ABILITIES = {
  talents: {
    label: { 'pt-BR': 'Talentos', 'en-US': 'Talents' },
    items: [
      { key: 'alertness', label: { 'pt-BR': 'Prontidão', 'en-US': 'Alertness' } },
      { key: 'athletics', label: { 'pt-BR': 'Esportes', 'en-US': 'Athletics' } },
      { key: 'brawl', label: { 'pt-BR': 'Briga', 'en-US': 'Brawl' } },
      { key: 'dodge', label: { 'pt-BR': 'Esquiva', 'en-US': 'Dodge' } },
      { key: 'empathy', label: { 'pt-BR': 'Empatia', 'en-US': 'Empathy' } },
      { key: 'expression', label: { 'pt-BR': 'Expressão', 'en-US': 'Expression' } },
      { key: 'intimidation', label: { 'pt-BR': 'Intimidação', 'en-US': 'Intimidation' } },
      { key: 'leadership', label: { 'pt-BR': 'Liderança', 'en-US': 'Leadership' } },
      { key: 'primalUrge', label: { 'pt-BR': 'Instinto Primitivo', 'en-US': 'Primal-Urge' } },
      { key: 'subterfuge', label: { 'pt-BR': 'Lábia', 'en-US': 'Subterfuge' } },
    ],
  },
  skills: {
    label: { 'pt-BR': 'Perícias', 'en-US': 'Skills' },
    items: [
      { key: 'animalKen', label: { 'pt-BR': 'Emp. c/Animais', 'en-US': 'Animal Ken' } },
      { key: 'crafts', label: { 'pt-BR': 'Ofícios', 'en-US': 'Crafts' } },
      { key: 'drive', label: { 'pt-BR': 'Condução', 'en-US': 'Drive' } },
      { key: 'etiquette', label: { 'pt-BR': 'Etiqueta', 'en-US': 'Etiquette' } },
      { key: 'firearms', label: { 'pt-BR': 'Armas de Fogo', 'en-US': 'Firearms' } },
      { key: 'melee', label: { 'pt-BR': 'Armas Brancas', 'en-US': 'Melee' } },
      { key: 'performance', label: { 'pt-BR': 'Performance', 'en-US': 'Performance' } },
      { key: 'security', label: { 'pt-BR': 'Segurança', 'en-US': 'Security' } },
      { key: 'stealth', label: { 'pt-BR': 'Furtividade', 'en-US': 'Stealth' } },
      { key: 'survival', label: { 'pt-BR': 'Sobrevivência', 'en-US': 'Survival' } },
    ],
  },
  knowledges: {
    label: { 'pt-BR': 'Conhecimentos', 'en-US': 'Knowledges' },
    items: [
      { key: 'academics', label: { 'pt-BR': 'Acadêmicos', 'en-US': 'Academics' } },
      { key: 'computer', label: { 'pt-BR': 'Computador', 'en-US': 'Computer' } },
      { key: 'enigmas', label: { 'pt-BR': 'Enigmas', 'en-US': 'Enigmas' } },
      { key: 'investigation', label: { 'pt-BR': 'Investigação', 'en-US': 'Investigation' } },
      { key: 'law', label: { 'pt-BR': 'Direito', 'en-US': 'Law' } },
      { key: 'linguistics', label: { 'pt-BR': 'Linguística', 'en-US': 'Linguistics' } },
      { key: 'medicine', label: { 'pt-BR': 'Medicina', 'en-US': 'Medicine' } },
      { key: 'occult', label: { 'pt-BR': 'Ocultismo', 'en-US': 'Occult' } },
      { key: 'politics', label: { 'pt-BR': 'Política', 'en-US': 'Politics' } },
      { key: 'rituals', label: { 'pt-BR': 'Rituais', 'en-US': 'Rituals' } },
      { key: 'science', label: { 'pt-BR': 'Ciências', 'en-US': 'Science' } },
    ],
  },
};

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
