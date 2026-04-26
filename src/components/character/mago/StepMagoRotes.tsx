import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { MagoFormData } from './StepMagoBasicInfo';

interface Props {
  formData: MagoFormData;
  updateFormData: (updates: Partial<MagoFormData>) => void;
}

export default function StepMagoRotes({ formData, updateFormData }: Props) {
  const { t, language } = useI18n();
  const [newRoteInputs, setNewRoteInputs] = useState<Record<number, string>>({});

  const rotes = formData.rotes || {};

  const addRote = (level: number) => {
    const roteName = newRoteInputs[level]?.trim();
    if (!roteName) return;
    const currentLevel = rotes[level] || [];
    updateFormData({
      rotes: { ...rotes, [level]: [...currentLevel, roteName] },
    });
    setNewRoteInputs((prev) => ({ ...prev, [level]: '' }));
  };

  const removeRote = (level: number, index: number) => {
    const currentLevel = [...(rotes[level] || [])];
    currentLevel.splice(index, 1);
    updateFormData({ rotes: { ...rotes, [level]: currentLevel } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">{t.mago.rotes}</CardTitle>
          <CardDescription className="font-body">{t.mago.rotesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5].map((level) => {
            const levelRotes = rotes[level] || [];
            return (
              <div key={level} className="space-y-2">
                <h4 className="font-medieval text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {language === 'pt-BR' ? `Nível ${level}` : `Level ${level}`}
                  </Badge>
                </h4>

                {levelRotes.length > 0 && (
                  <div className="space-y-1">
                    {levelRotes.map((rote, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 border border-border"
                      >
                        <span className="text-sm font-body">{rote}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeRote(level, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newRoteInputs[level] || ''}
                    onChange={(e) =>
                      setNewRoteInputs((prev) => ({ ...prev, [level]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRote(level);
                      }
                    }}
                    placeholder={t.mago.rotePlaceholder}
                    className="text-sm bg-input border-border"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addRote(level)}
                    disabled={!newRoteInputs[level]?.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
