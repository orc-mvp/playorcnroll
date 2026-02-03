import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Scroll } from 'lucide-react';
import type { CharacterFormData } from '@/pages/CreateCharacter';

interface StepBasicInfoProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export default function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  const { t } = useI18n();

  return (
    <Card className="medieval-card max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-medieval text-2xl">
          {t.character.name} & {t.character.concept}
        </CardTitle>
        <CardDescription className="font-body">
          Dê vida ao seu herói com um nome memorável e um conceito que defina sua essência
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Character Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="font-medieval text-lg flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {t.character.name}
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Ex: Aldric, o Destemido"
            className="text-lg"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            {formData.name.length}/50 caracteres
          </p>
        </div>

        {/* Character Concept */}
        <div className="space-y-2">
          <Label htmlFor="concept" className="font-medieval text-lg flex items-center gap-2">
            <Scroll className="w-4 h-4 text-primary" />
            {t.character.concept}
            <span className="text-xs text-muted-foreground font-body">(opcional)</span>
          </Label>
          <Textarea
            id="concept"
            value={formData.concept}
            onChange={(e) => updateFormData({ concept: e.target.value })}
            placeholder={t.character.conceptPlaceholder}
            className="min-h-[100px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {formData.concept.length}/200 caracteres
          </p>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="font-medieval text-sm mb-2 text-primary">Dicas</h4>
          <ul className="text-xs text-muted-foreground space-y-1 font-body">
            <li>• O nome deve ser único e memorável</li>
            <li>• O conceito ajuda a definir a personalidade e história</li>
            <li>• Pense em quem seu personagem era antes de se tornar um herói</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
