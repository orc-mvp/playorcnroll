import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Shield, TrendingUp, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroicMoveModalProps {
  characterId: string;
  sessionId: string;
  isGroupTest: boolean;
  onClose: () => void;
}

type HeroicOption = 'A' | 'B' | 'C' | 'D';

export function HeroicMoveModal({ characterId, sessionId, isGroupTest, onClose }: HeroicMoveModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<HeroicOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states for each option
  const [markName, setMarkName] = useState('');
  const [markScope, setMarkScope] = useState('');
  const [markEffect, setMarkEffect] = useState('');
  const [themeName, setThemeName] = useState('');
  const [narrativeType, setNarrativeType] = useState<'npc' | 'reputation' | 'resource'>('npc');
  const [narrativeDesc, setNarrativeDesc] = useState('');

  const options = [
    {
      id: 'A' as HeroicOption,
      icon: Shield,
      title: t.heroicMoves.optionA,
      desc: t.heroicMoves.optionADesc,
      disabled: false,
    },
    {
      id: 'B' as HeroicOption,
      icon: TrendingUp,
      title: t.heroicMoves.optionB,
      desc: t.heroicMoves.optionBDesc,
      disabled: false,
    },
    {
      id: 'C' as HeroicOption,
      icon: BookOpen,
      title: t.heroicMoves.optionC,
      desc: t.heroicMoves.optionCDesc,
      disabled: false,
    },
    {
      id: 'D' as HeroicOption,
      icon: Users,
      title: t.heroicMoves.optionD,
      desc: t.heroicMoves.optionDDesc + ' ' + t.heroicMoves.onlyInGroupTest,
      disabled: !isGroupTest,
    },
  ];

  const handleSubmit = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);

    try {
      const { data: character } = await supabase
        .from('characters')
        .select('heroic_moves_stored, major_marks, mark_progress, extended_narratives')
        .eq('id', characterId)
        .single();

      if (!character || character.heroic_moves_stored < 1) {
        toast({ title: 'Sem movimentos heroicos disponíveis', variant: 'destructive' });
        return;
      }

      // Deduct one heroic move
      await supabase
        .from('characters')
        .update({ heroic_moves_stored: character.heroic_moves_stored - 1 })
        .eq('id', characterId);

      switch (selectedOption) {
        case 'A': {
          // Add temporary major mark
          const majorMarks = (character.major_marks as any[]) || [];
          majorMarks.push({
            name: markName,
            scope: markScope,
            effect: markEffect,
            is_temporary: true,
            created_at: new Date().toISOString(),
          });
          
          await supabase
            .from('characters')
            .update({ major_marks: majorMarks })
            .eq('id', characterId);
          
          toast({ title: 'Marca Maior Temporária criada!' });
          break;
        }
        
        case 'B': {
          // Add progress toward minor mark
          const progress = (character.mark_progress as Record<string, number>) || {};
          progress[themeName] = (progress[themeName] || 0) + 1;
          
          await supabase
            .from('characters')
            .update({ mark_progress: progress })
            .eq('id', characterId);
          
          if (progress[themeName] >= 3) {
            toast({ 
              title: t.heroicMoves.markAchieved,
              description: t.heroicMoves.workWithNarrator,
            });
          } else {
            toast({ title: `Progresso em ${themeName}: ${progress[themeName]}/3` });
          }
          break;
        }
        
        case 'C': {
          // Add extended narrative
          const narratives = (character.extended_narratives as any[]) || [];
          narratives.push({
            type: narrativeType,
            description: narrativeDesc,
            created_at: new Date().toISOString(),
          });
          
          await supabase
            .from('characters')
            .update({ extended_narratives: narratives })
            .eq('id', characterId);
          
          toast({ title: 'Narrativa Estendida adicionada!' });
          break;
        }
        
        case 'D': {
          // Pull the group - create event
          await supabase.from('session_events').insert({
            session_id: sessionId,
            event_type: 'pull_group',
            event_data: { character_id: characterId },
          });
          
          toast({ title: 'Você puxou o grupo! +1 sucesso coletivo' });
          break;
        }
      }

      onClose();
    } catch (error) {
      console.error('Error using heroic move:', error);
      toast({ title: 'Erro ao usar movimento heroico', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOptionForm = () => {
    switch (selectedOption) {
      case 'A':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medieval">{t.heroicMoves.markName}</Label>
              <Input 
                value={markName} 
                onChange={(e) => setMarkName(e.target.value)}
                placeholder="Ex: Força do Desespero"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.heroicMoves.markScope}</Label>
              <Input 
                value={markScope} 
                onChange={(e) => setMarkScope(e.target.value)}
                placeholder="Ex: Em combate contra múltiplos inimigos"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.heroicMoves.markEffect}</Label>
              <Textarea 
                value={markEffect} 
                onChange={(e) => setMarkEffect(e.target.value)}
                placeholder={t.heroicMoves.anyPairPositive}
              />
            </div>
          </div>
        );
      
      case 'B':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medieval">{t.heroicMoves.themeName}</Label>
              <Input 
                value={themeName} 
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Ex: Liderança, Combate, Diplomacia"
              />
            </div>
          </div>
        );
      
      case 'C':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medieval">{t.heroicMoves.createWhat}</Label>
              <div className="flex gap-2">
                {(['npc', 'reputation', 'resource'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={narrativeType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNarrativeType(type)}
                  >
                    {type === 'npc' && t.heroicMoves.npcAlly}
                    {type === 'reputation' && t.heroicMoves.reputation}
                    {type === 'resource' && t.heroicMoves.resource}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">
                {narrativeType === 'npc' && t.heroicMoves.npcRelation}
                {narrativeType === 'reputation' && t.heroicMoves.reputationPhrase}
                {narrativeType === 'resource' && t.heroicMoves.resourceDesc}
              </Label>
              <Textarea 
                value={narrativeDesc} 
                onChange={(e) => setNarrativeDesc(e.target.value)}
                placeholder="Descreva..."
              />
            </div>
          </div>
        );
      
      case 'D':
        return (
          <div className="text-center p-4">
            <Users className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="font-body text-muted-foreground">
              Confirme para adicionar +1 ao resultado coletivo do grupo
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const isFormValid = () => {
    switch (selectedOption) {
      case 'A': return markName.trim() && markScope.trim();
      case 'B': return themeName.trim();
      case 'C': return narrativeDesc.trim();
      case 'D': return true;
      default: return false;
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            {t.heroicMoves.title}
          </DialogTitle>
        </DialogHeader>

        {!selectedOption ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground font-body">
              {t.heroicMoves.choose}
            </p>
            {options.map((opt) => (
              <Card
                key={opt.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  opt.disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !opt.disabled && setSelectedOption(opt.id)}
              >
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medieval flex items-center gap-2">
                    <opt.icon className="w-4 h-4 text-primary" />
                    {opt.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-body">
                    {opt.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedOption(null)}
              className="text-muted-foreground"
            >
              ← Voltar
            </Button>
            
            {renderOptionForm()}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
              >
                {t.common.cancel}
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? t.common.loading : t.common.confirm}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
