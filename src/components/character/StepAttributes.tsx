import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Sword, 
  Shield, 
  Heart, 
  Eye, 
  Sparkles,
  ChevronUp,
  Minus,
  ChevronDown
} from 'lucide-react';
import type { CharacterFormData, AttributeType } from '@/pages/CreateCharacter';

interface StepAttributesProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const attributeConfig = {
  aggression: { icon: Sword, color: 'text-red-500' },
  determination: { icon: Shield, color: 'text-amber-500' },
  seduction: { icon: Heart, color: 'text-pink-500' },
  cunning: { icon: Eye, color: 'text-emerald-500' },
  faith: { icon: Sparkles, color: 'text-blue-500' },
};

const typeOrder: AttributeType[] = ['strong', 'neutral', 'weak'];

export default function StepAttributes({ formData, updateFormData }: StepAttributesProps) {
  const { t } = useI18n();

  const getTypeCounts = () => {
    const types = Object.values(formData.attributes);
    return {
      strong: types.filter(t => t === 'strong').length,
      neutral: types.filter(t => t === 'neutral').length,
      weak: types.filter(t => t === 'weak').length,
    };
  };

  const counts = getTypeCounts();
  const isValid = counts.strong === 2 && counts.neutral === 1 && counts.weak === 2;

  const cycleAttribute = (attr: keyof typeof formData.attributes) => {
    const current = formData.attributes[attr];
    const currentIndex = typeOrder.indexOf(current);
    const nextIndex = (currentIndex + 1) % typeOrder.length;
    const nextType = typeOrder[nextIndex];

    updateFormData({
      attributes: {
        ...formData.attributes,
        [attr]: nextType,
      },
    });
  };

  const getTypeStyle = (type: AttributeType) => {
    switch (type) {
      case 'strong':
        return 'bg-primary/20 border-primary text-primary';
      case 'neutral':
        return 'bg-muted border-muted-foreground/30 text-muted-foreground';
      case 'weak':
        return 'bg-destructive/20 border-destructive text-destructive';
    }
  };

  const getTypeIcon = (type: AttributeType) => {
    switch (type) {
      case 'strong':
        return <ChevronUp className="w-4 h-4" />;
      case 'neutral':
        return <Minus className="w-4 h-4" />;
      case 'weak':
        return <ChevronDown className="w-4 h-4" />;
    }
  };

  return (
    <Card className="medieval-card max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-medieval text-2xl">
          {t.character.attributes}
        </CardTitle>
        <CardDescription className="font-body">
          {t.character.distributeAttributes}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Distribution Summary */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn(
              "px-3 py-1",
              counts.strong === 2 ? "bg-primary/20 border-primary" : "bg-muted"
            )}
          >
            {t.attributes.strong}: {counts.strong}/2
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "px-3 py-1",
              counts.neutral === 1 ? "bg-muted border-muted-foreground" : "bg-muted"
            )}
          >
            {t.attributes.neutral}: {counts.neutral}/1
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "px-3 py-1",
              counts.weak === 2 ? "bg-destructive/20 border-destructive" : "bg-muted"
            )}
          >
            {t.attributes.weak}: {counts.weak}/2
          </Badge>
        </div>

        {/* Hint */}
        <p className="text-center text-sm text-muted-foreground font-body">
          {t.character.distributeHint}
        </p>

        {/* Attributes */}
        <div className="space-y-3">
          {(Object.keys(attributeConfig) as (keyof typeof attributeConfig)[]).map((attr) => {
            const config = attributeConfig[attr];
            const Icon = config.icon;
            const type = formData.attributes[attr];

            return (
              <button
                key={attr}
                type="button"
                onClick={() => cycleAttribute(attr)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all duration-200",
                  "flex items-center justify-between",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  getTypeStyle(type)
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-6 h-6", config.color)} />
                  <span className="font-medieval text-lg">
                    {t.attributes[attr as keyof typeof t.attributes]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getTypeIcon(type)}
                  <span className="font-body text-sm min-w-[60px] text-right">
                    {t.attributes[type]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Validation Message */}
        {!isValid && (
          <p className="text-center text-sm text-amber-500 font-body">
            Clique nos atributos para alternar entre Forte, Neutro e Fraco
          </p>
        )}

        {isValid && (
          <p className="text-center text-sm text-primary font-body">
            ✓ Distribuição válida! Você pode prosseguir.
          </p>
        )}

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="font-medieval text-sm mb-2 text-primary">Como funciona</h4>
          <ul className="text-xs text-muted-foreground space-y-1 font-body">
            <li>• <strong>Forte:</strong> Bônus nos testes e maior chance de Extremo Positivo</li>
            <li>• <strong>Neutro:</strong> Sem bônus ou penalidade</li>
            <li>• <strong>Fraco:</strong> Penalidade nos testes e maior chance de Extremo Negativo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
