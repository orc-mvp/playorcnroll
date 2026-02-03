import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateComplicationModal } from './CreateComplicationModal';
import { ManifestComplicationModal } from './ManifestComplicationModal';
import { 
  AlertTriangle, 
  Plus, 
  User, 
  Eye, 
  EyeOff,
  Sparkles,
  Skull,
  Users,
  Footprints,
  Handshake,
  Coins
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

export function ComplicationsNarratorPanel({ sessionId, participants }: ComplicationsNarratorPanelProps) {
  const { t } = useI18n();
  const [complications, setComplications] = useState<Complication[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState<{
    characterId: string;
    characterName: string;
  } | null>(null);
  const [manifestModalOpen, setManifestModalOpen] = useState<{
    complication: Complication;
    characterName: string;
  } | null>(null);

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

  return (
    <Card className="medieval-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-medieval text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          {t.complications.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-80">
          <div className="space-y-4">
            {characters.map(char => {
              const charComplications = getComplicationsByCharacter(char.id);
              const count = charComplications.length;
              const isAtLimit = count >= 3;
              
              return (
                <div 
                  key={char.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    isAtLimit 
                      ? "bg-red-500/10 border-red-500/50" 
                      : "bg-muted/30 border-border"
                  )}
                >
                  {/* Character Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medieval text-sm">{char.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          isAtLimit 
                            ? "bg-red-500/20 text-red-500 border-red-500/50"
                            : count > 0 
                              ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                              : ""
                        )}
                      >
                        {count}/3
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0"
                        onClick={() => setCreateModalOpen({ 
                          characterId: char.id, 
                          characterName: char.name 
                        })}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Warning at limit */}
                  {isAtLimit && (
                    <div className="flex items-center gap-2 p-2 mb-2 rounded bg-red-500/20 text-red-500 text-xs">
                      <Skull className="w-4 h-4" />
                      <span className="font-body">
                        {t.complications.negativeMarkWarning}
                      </span>
                    </div>
                  )}

                  {/* Complications List */}
                  {charComplications.length > 0 ? (
                    <div className="space-y-2">
                      {charComplications.map(comp => {
                        const TypeIcon = typeIcons[comp.type] || AlertTriangle;
                        return (
                          <div 
                            key={comp.id}
                            className="flex items-start gap-2 p-2 rounded bg-background/50"
                          >
                            <TypeIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-body line-clamp-2">
                                {comp.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {t.complications[comp.type as keyof typeof t.complications] || comp.type}
                                </Badge>
                                {comp.is_visible ? (
                                  <Eye className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setManifestModalOpen({
                                complication: comp,
                                characterName: char.name,
                              })}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {t.complications.manifest}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhuma complicação ativa
                    </p>
                  )}
                </div>
              );
            })}

            {characters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum jogador conectado
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Create Modal */}
      {createModalOpen && (
        <CreateComplicationModal
          sessionId={sessionId}
          characterId={createModalOpen.characterId}
          characterName={createModalOpen.characterName}
          onClose={() => setCreateModalOpen(null)}
          onCreated={fetchComplications}
        />
      )}

      {/* Manifest Modal */}
      {manifestModalOpen && (
        <ManifestComplicationModal
          complicationId={manifestModalOpen.complication.id}
          sessionId={sessionId}
          description={manifestModalOpen.complication.description}
          characterName={manifestModalOpen.characterName}
          onClose={() => setManifestModalOpen(null)}
          onManifested={fetchComplications}
        />
      )}
    </Card>
  );
}
