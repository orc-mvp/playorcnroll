import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sword, Shield, Heart, Brain, Flame, User, Scroll } from 'lucide-react';

type AttributeType = 'strong' | 'neutral' | 'weak';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  aggression_type: string;
  determination_type: string;
  seduction_type: string;
  cunning_type: string;
  faith_type: string;
}

interface EditCharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  onSave: (updated: Character) => void;
}

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

const attributeKeys = ['aggression', 'determination', 'seduction', 'cunning', 'faith'] as const;

const typeStyles: Record<AttributeType, string> = {
  strong: 'bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30',
  neutral: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/30',
  weak: 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30',
};

export function EditCharacterModal({
  open,
  onOpenChange,
  character,
  onSave,
}: EditCharacterModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [attributes, setAttributes] = useState<Record<string, AttributeType>>({
    aggression: character.aggression_type as AttributeType,
    determination: character.determination_type as AttributeType,
    seduction: character.seduction_type as AttributeType,
    cunning: character.cunning_type as AttributeType,
    faith: character.faith_type as AttributeType,
  });
  const [saving, setSaving] = useState(false);

  // Reset form when character changes
  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setAttributes({
      aggression: character.aggression_type as AttributeType,
      determination: character.determination_type as AttributeType,
      seduction: character.seduction_type as AttributeType,
      cunning: character.cunning_type as AttributeType,
      faith: character.faith_type as AttributeType,
    });
  }, [character]);

  // Count attribute types
  const countTypes = () => {
    const counts = { strong: 0, neutral: 0, weak: 0 };
    Object.values(attributes).forEach((type) => {
      counts[type]++;
    });
    return counts;
  };

  const counts = countTypes();
  const isValidDistribution = counts.strong === 2 && counts.neutral === 1 && counts.weak === 2;

  const cycleType = (attr: string) => {
    const current = attributes[attr];
    const next: AttributeType = current === 'weak' ? 'neutral' : current === 'neutral' ? 'strong' : 'weak';
    setAttributes((prev) => ({ ...prev, [attr]: next }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t.customMarks.nameRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!isValidDistribution) {
      toast({
        title: t.character.invalidDistribution,
        description: t.character.distributeHint,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('characters')
        .update({
          name: name.trim(),
          concept: concept.trim() || null,
          aggression_type: attributes.aggression,
          determination_type: attributes.determination,
          seduction_type: attributes.seduction,
          cunning_type: attributes.cunning,
          faith_type: attributes.faith,
        })
        .eq('id', character.id);

      if (error) throw error;

      const updated: Character = {
        ...character,
        name: name.trim(),
        concept: concept.trim() || null,
        aggression_type: attributes.aggression,
        determination_type: attributes.determination,
        seduction_type: attributes.seduction,
        cunning_type: attributes.cunning,
        faith_type: attributes.faith,
      };

      onSave(updated);
      toast({
        title: t.character.updated,
      });
      onOpenChange(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating character:', error);
      toast({
        title: t.common.errorSaving,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t.character.edit}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t.character.editDescription}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="basic" className="font-medieval">
              <User className="w-4 h-4 mr-1" />
              {t.character.basic}
            </TabsTrigger>
            <TabsTrigger value="attributes" className="font-medieval">
              <Scroll className="w-4 h-4 mr-1" />
              {t.character.attributes}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-medieval">
                {t.character.name} *
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.character.namePlaceholder}
                className="font-body"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-concept" className="font-medieval">
                {t.character.concept}
              </Label>
              <Textarea
                id="edit-concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={t.character.conceptPlaceholder}
                className="font-body min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="space-y-4 mt-4 overflow-y-auto flex-1">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground font-body">
                {t.character.distributeHint}
              </p>
              <div className="flex justify-center gap-4 mt-2">
                <Badge
                  variant="outline"
                  className={`${counts.strong === 2 ? 'border-green-500 text-green-500' : 'border-muted'}`}
                >
                  {counts.strong}/2 {t.attributes.strong}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${counts.neutral === 1 ? 'border-yellow-500 text-yellow-500' : 'border-muted'}`}
                >
                  {counts.neutral}/1 {t.attributes.neutral}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${counts.weak === 2 ? 'border-red-500 text-red-500' : 'border-muted'}`}
                >
                  {counts.weak}/2 {t.attributes.weak}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {attributeKeys.map((attr) => {
                const Icon = attributeIcons[attr];
                const type = attributes[attr];

                return (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => cycleType(attr)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-medieval">{t.attributes[attr]}</span>
                    </div>
                    <Badge className={`${typeStyles[type]} cursor-pointer`}>
                      {t.attributes[type]}
                    </Badge>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t.character.clickToCycle}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValidDistribution}>
            {saving ? t.common.loading : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
