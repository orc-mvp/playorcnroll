import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Sword, 
  Shield, 
  Heart, 
  Eye, 
  Sparkles,
  ArrowUp,
  ArrowDown,
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

type AttrKey = keyof typeof attributeConfig;

// Position → type mapping: positions 0,1 = strong; 2 = neutral; 3,4 = weak
const positionToType = (pos: number): AttributeType => {
  if (pos <= 1) return 'strong';
  if (pos === 2) return 'neutral';
  return 'weak';
};

const positionLabel = (pos: number, t: any): string => {
  if (pos <= 1) return t.attributes.strong;
  if (pos === 2) return t.attributes.neutral;
  return t.attributes.weak;
};

const positionStyle = (pos: number): string => {
  if (pos <= 1) return 'bg-primary/20 border-primary/50';
  if (pos === 2) return 'bg-muted border-muted-foreground/30';
  return 'bg-destructive/10 border-destructive/40';
};

const positionBadgeStyle = (pos: number): string => {
  if (pos <= 1) return 'bg-primary/20 border-primary text-primary';
  if (pos === 2) return 'bg-muted border-muted-foreground/50 text-muted-foreground';
  return 'bg-destructive/20 border-destructive text-destructive';
};

export default function StepAttributes({ formData, updateFormData }: StepAttributesProps) {
  const { t } = useI18n();

  // Derive ordered list from current attribute types
  // We need to maintain a consistent ordering, so we store order as state derived from types
  const getOrderFromAttributes = (): AttrKey[] => {
    const attrs = Object.entries(formData.attributes) as [AttrKey, AttributeType][];
    const strong = attrs.filter(([, type]) => type === 'strong').map(([k]) => k);
    const neutral = attrs.filter(([, type]) => type === 'neutral').map(([k]) => k);
    const weak = attrs.filter(([, type]) => type === 'weak').map(([k]) => k);
    return [...strong, ...neutral, ...weak];
  };

  const orderedAttrs = getOrderFromAttributes();

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedAttrs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    applyOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === orderedAttrs.length - 1) return;
    const newOrder = [...orderedAttrs];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    applyOrder(newOrder);
  };

  const applyOrder = (order: AttrKey[]) => {
    const newAttributes: Record<AttrKey, AttributeType> = {} as any;
    order.forEach((attr, pos) => {
      newAttributes[attr] = positionToType(pos);
    });
    updateFormData({ attributes: newAttributes });
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
        {/* Hint */}
        <p className="text-center text-sm text-muted-foreground font-body">
          {t.character.distributeHint}
        </p>

        {/* Zone labels */}
        <div className="space-y-1">
          {orderedAttrs.map((attr, index) => {
            const config = attributeConfig[attr];
            const Icon = config.icon;
            const isFirst = index === 0;
            const isLast = index === orderedAttrs.length - 1;

            // Show zone divider labels
            const showZoneLabel = index === 0 || positionToType(index) !== positionToType(index - 1);

            return (
              <div key={attr}>
                {showZoneLabel && (
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="outline" className={cn("text-xs px-2", positionBadgeStyle(index))}>
                      {positionLabel(index, t)}
                      {positionToType(index) === 'strong' && ' (×2)'}
                      {positionToType(index) === 'weak' && ' (×2)'}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
                    positionStyle(index)
                  )}
                >
                  {/* Move Up */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 touch-manipulation"
                    onClick={() => moveUp(index)}
                    disabled={isFirst}
                  >
                    <ArrowUp className="w-6 h-6" />
                  </Button>

                  {/* Attribute info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={cn("w-6 h-6 shrink-0", config.color)} />
                    <span className="font-medieval text-lg truncate">
                      {t.attributes[attr as keyof typeof t.attributes]}
                    </span>
                  </div>

                  {/* Move Down */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 touch-manipulation"
                    onClick={() => moveDown(index)}
                    disabled={isLast}
                  >
                    <ArrowDown className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="font-medieval text-sm mb-2 text-primary">{t.character.howItWorks}</h4>
          <ul className="text-xs text-muted-foreground space-y-1 font-body">
            <li>• <strong>{t.attributes.strong}:</strong> {t.character.strongDescription}</li>
            <li>• <strong>{t.attributes.neutral}:</strong> {t.character.neutralDescription}</li>
            <li>• <strong>{t.attributes.weak}:</strong> {t.character.weakDescription}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
