import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { LobisomemFormData } from './StepLobisomemBasicInfo';

interface StepLobisomemGiftsProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
}

export default function StepLobisomemGifts({ formData, updateFormData }: StepLobisomemGiftsProps) {
  const { t, language } = useI18n();
  const [newGiftInputs, setNewGiftInputs] = useState<Record<number, string>>({});

  const gifts = formData.gifts || {};

  const addGift = (level: number) => {
    const giftName = newGiftInputs[level]?.trim();
    if (!giftName) return;

    const currentLevel = gifts[level] || [];
    updateFormData({
      gifts: {
        ...gifts,
        [level]: [...currentLevel, giftName],
      },
    });
    setNewGiftInputs((prev) => ({ ...prev, [level]: '' }));
  };

  const removeGift = (level: number, index: number) => {
    const currentLevel = [...(gifts[level] || [])];
    currentLevel.splice(index, 1);
    updateFormData({
      gifts: {
        ...gifts,
        [level]: currentLevel,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {t.lobisomem.gifts}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Adicione os Dons do seu Garou por nível (texto livre)'
              : 'Add your Garou\'s Gifts by level (free text)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5].map((level) => {
            const levelGifts = gifts[level] || [];
            return (
              <div key={level} className="space-y-2">
                <h4 className="font-medieval text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {language === 'pt-BR' ? `Nível ${level}` : `Level ${level}`}
                  </Badge>
                </h4>

                {/* Existing gifts */}
                {levelGifts.length > 0 && (
                  <div className="space-y-1">
                    {levelGifts.map((gift, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 border border-border"
                      >
                        <span className="text-sm font-body">{gift}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeGift(level, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new gift */}
                <div className="flex gap-2">
                  <Input
                    value={newGiftInputs[level] || ''}
                    onChange={(e) =>
                      setNewGiftInputs((prev) => ({ ...prev, [level]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addGift(level);
                      }
                    }}
                    placeholder={t.lobisomem.giftPlaceholder as string}
                    className="text-sm bg-input border-border"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addGift(level)}
                    disabled={!newGiftInputs[level]?.trim()}
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
