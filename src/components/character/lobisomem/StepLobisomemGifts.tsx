import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { LobisomemFormData } from './StepLobisomemBasicInfo';
import { getGiftName, getGiftDescription, type GiftEntry } from '@/lib/lobisomem/giftUtils';

interface StepLobisomemGiftsProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
}

export default function StepLobisomemGifts({ formData, updateFormData }: StepLobisomemGiftsProps) {
  const { t, language } = useI18n();
  const [draftName, setDraftName] = useState<Record<number, string>>({});
  const [draftDesc, setDraftDesc] = useState<Record<number, string>>({});

  const gifts = (formData.gifts || {}) as Record<number, GiftEntry[]>;

  const addGift = (level: number) => {
    const name = draftName[level]?.trim();
    if (!name) return;
    const description = draftDesc[level]?.trim() || '';
    const currentLevel = gifts[level] || [];
    updateFormData({
      gifts: {
        ...gifts,
        [level]: [...currentLevel, { name, description }],
      } as any,
    });
    setDraftName((p) => ({ ...p, [level]: '' }));
    setDraftDesc((p) => ({ ...p, [level]: '' }));
  };

  const removeGift = (level: number, index: number) => {
    const currentLevel = [...(gifts[level] || [])];
    currentLevel.splice(index, 1);
    updateFormData({
      gifts: { ...gifts, [level]: currentLevel } as any,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">{t.lobisomem.gifts}</CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Adicione os Dons do seu Garou: nome e descrição'
              : "Add your Garou's Gifts: name and description"}
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

                {levelGifts.length > 0 && (
                  <div className="space-y-1">
                    {levelGifts.map((gift, index) => {
                      const name = getGiftName(gift);
                      const desc = getGiftDescription(gift);
                      return (
                        <div
                          key={index}
                          className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted/30 border border-border"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-body font-medium">{name}</p>
                            {desc && (
                              <p className="text-xs text-muted-foreground font-body mt-0.5 whitespace-pre-wrap">
                                {desc}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeGift(level, index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2 rounded-md border border-dashed border-border p-2">
                  <Input
                    value={draftName[level] || ''}
                    onChange={(e) => setDraftName((p) => ({ ...p, [level]: e.target.value }))}
                    placeholder={language === 'pt-BR' ? 'Nome do Dom' : 'Gift name'}
                    className="text-sm bg-input border-border"
                  />
                  <Textarea
                    value={draftDesc[level] || ''}
                    onChange={(e) => setDraftDesc((p) => ({ ...p, [level]: e.target.value }))}
                    placeholder={language === 'pt-BR' ? 'Descrição (opcional)' : 'Description (optional)'}
                    rows={2}
                    className="text-sm bg-input border-border"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addGift(level)}
                      disabled={!draftName[level]?.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === 'pt-BR' ? 'Adicionar' : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
