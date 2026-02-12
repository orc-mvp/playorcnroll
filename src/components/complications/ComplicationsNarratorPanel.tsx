import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComplicationsManagerModal } from './ComplicationsManagerModal';
import { 
  AlertTriangle, 
  User, 
  Eye, 
  EyeOff,
  Skull,
  Users,
  Footprints,
  Handshake,
  Coins,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Complication {
  id: string;
  character_id: string;
  type: string;
  description: string;
  is_visible: boolean;
  is_manifested: boolean;
  manifest_note: string | null;
  created_at: string;
}

interface ComplicationsNarratorPanelProps {
  sessionId: string;
  participants: Array<{
    character_id: string | null;
    character?: { id: string; name: string } | null;
  }>;
}

const typeIcons: Record<string, React.ElementType> = {
  reputational: Users,
  tracking: Footprints,
  betrayal: Handshake,
  debt: Coins,
  minor_curse: Skull,
};

// Map snake_case DB values to camelCase translation keys
const typeTranslationKeys: Record<string, string> = {
  reputational: 'reputational',
  tracking: 'tracking',
  betrayal: 'betrayal',
  debt: 'debt',
  minor_curse: 'minorCurse',
};

export function ComplicationsNarratorPanel({ sessionId, participants }: ComplicationsNarratorPanelProps) {
  const { t } = useI18n();
  const [complications, setComplications] = useState<Complication[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);

  const fetchComplications = async () => {
    const { data } = await supabase
      .from('complications')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_manifested', false)
      .order('created_at', { ascending: false });
    
    setComplications(data || []);
  };

  useEffect(() => {
    fetchComplications();

    // Subscribe to changes
    const channel = supabase
      .channel(`complications-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complications', filter: `session_id=eq.${sessionId}` },
        () => fetchComplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const getCharacterName = (characterId: string): string => {
    const participant = participants.find(p => p.character_id === characterId);
    return participant?.character?.name || 'Jogador';
  };

  const getComplicationsByCharacter = (characterId: string) => {
    return complications.filter(c => c.character_id === characterId && !c.is_manifested);
  };

  const characters = participants
    .filter(p => p.character_id && p.character)
    .map(p => ({
      id: p.character_id!,
      name: p.character!.name,
    }));

  const totalComplications = complications.length;
  const charactersAtLimit = characters.filter(c => getComplicationsByCharacter(c.id).length >= 3);

  return (
    <>
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medieval text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {t.complications.title}
            </CardTitle>
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              onClick={() => setManagerOpen(true)}
              title={t.complications?.title || 'Gerenciar'}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30">
            <div className="text-center">
              <p className="text-2xl font-medieval text-red-500">{totalComplications}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
            {charactersAtLimit.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500/20 text-red-500">
                <Skull className="w-4 h-4" />
                <span className="text-xs font-body">
                  {charactersAtLimit.length} no limite!
                </span>
              </div>
            )}
          </div>

          {/* Character Summary List */}
          <div className="space-y-2">
            {characters.map(char => {
              const charComplications = getComplicationsByCharacter(char.id);
              const count = charComplications.length;
              const isAtLimit = count >= 3;
              
              if (count === 0) return null;
              
              return (
                <div 
                  key={char.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border",
                    isAtLimit 
                      ? "bg-red-500/10 border-red-500/50" 
                      : "bg-muted/30 border-border"
                  )}
                >
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medieval text-sm flex-1 truncate">{char.name}</span>
                  <div className="flex items-center gap-1">
                    {charComplications.slice(0, 3).map(comp => {
                      const TypeIcon = typeIcons[comp.type] || AlertTriangle;
                      return (
                        <div 
                          key={comp.id}
                          className="w-6 h-6 rounded bg-background/50 flex items-center justify-center"
                          title={`${t.complications[typeTranslationKeys[comp.type] as keyof typeof t.complications] || comp.type}${!comp.is_visible ? ' (oculta)' : ''}`}
                        >
                          <TypeIcon className={cn(
                            "w-3 h-3",
                            comp.is_visible ? "text-red-500" : "text-muted-foreground"
                          )} />
                        </div>
                      );
                    })}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs shrink-0",
                      isAtLimit 
                        ? "bg-red-500/20 text-red-500 border-red-500/50"
                        : "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                    )}
                  >
                    {count}/3
                  </Badge>
                </div>
              );
            })}

            {characters.every(c => getComplicationsByCharacter(c.id).length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma complicação ativa
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manager Modal */}
      <ComplicationsManagerModal
        open={managerOpen}
        onOpenChange={setManagerOpen}
        sessionId={sessionId}
        participants={participants}
      />
    </>
  );
}
