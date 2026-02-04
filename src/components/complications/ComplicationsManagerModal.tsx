import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateComplicationModal } from './CreateComplicationModal';
import { EditComplicationModal } from './EditComplicationModal';
import { ManifestComplicationModal } from './ManifestComplicationModal';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Plus,
  Pencil,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Skull,
  Users,
  Footprints,
  Handshake,
  Coins,
} from 'lucide-react';

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

interface ComplicationsManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ComplicationsManagerModal({
  open,
  onOpenChange,
  sessionId,
  participants,
}: ComplicationsManagerModalProps) {
  const { t } = useI18n();
  const [complications, setComplications] = useState<Complication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState<{
    characterId: string;
    characterName: string;
  } | null>(null);
  const [manifestModalOpen, setManifestModalOpen] = useState<{
    complication: Complication;
    characterName: string;
  } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<{
    complication: Complication;
    characterName: string;
  } | null>(null);

  const characters = participants
    .filter((p) => p.character_id && p.character)
    .map((p) => ({
      id: p.character_id!,
      name: p.character!.name,
    }));

  const fetchComplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('complications')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_manifested', false)
      .order('created_at', { ascending: false });

    setComplications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchComplications();
      if (characters.length > 0 && !selectedCharacter) {
        setSelectedCharacter(characters[0].id);
      }
    }
  }, [open, sessionId]);

  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel(`complications-modal-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complications',
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchComplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, sessionId]);

  const getCharacterName = (characterId: string): string => {
    const char = characters.find((c) => c.id === characterId);
    return char?.name || 'Jogador';
  };

  const getComplicationsByCharacter = (characterId: string) => {
    return complications.filter((c) => c.character_id === characterId);
  };

  const selectedCharacterData = characters.find((c) => c.id === selectedCharacter);
  const charComplications = selectedCharacter
    ? getComplicationsByCharacter(selectedCharacter)
    : [];
  const isAtLimit = charComplications.length >= 3;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {t.complications.title}
            </DialogTitle>
          </DialogHeader>

          {characters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-body">Nenhum jogador conectado</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Character Tabs */}
              <Tabs
                value={selectedCharacter || characters[0]?.id}
                onValueChange={setSelectedCharacter}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 h-auto p-1 shrink-0">
                  {characters.map((char) => {
                    const count = getComplicationsByCharacter(char.id).length;
                    const atLimit = count >= 3;
                    return (
                      <TabsTrigger
                        key={char.id}
                        value={char.id}
                        className={cn(
                          'text-xs py-2 px-3 gap-1.5',
                          atLimit && 'data-[state=active]:bg-red-500/20'
                        )}
                      >
                        <User className="w-3 h-3" />
                        <span className="truncate">{char.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-5 px-1.5 text-xs ml-1',
                            atLimit
                              ? 'bg-red-500/20 text-red-500 border-red-500/50'
                              : count > 0
                              ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
                              : ''
                          )}
                        >
                          {count}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {characters.map((char) => (
                  <TabsContent
                    key={char.id}
                    value={char.id}
                    className="flex-1 flex flex-col min-h-0 mt-4"
                  >
                    {/* Header with Add button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medieval">{char.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            getComplicationsByCharacter(char.id).length >= 3
                              ? 'bg-red-500/20 text-red-500 border-red-500/50'
                              : ''
                          )}
                        >
                          {getComplicationsByCharacter(char.id).length}/3
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          setCreateModalOpen({
                            characterId: char.id,
                            characterName: char.name,
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {/* Warning at limit */}
                    {getComplicationsByCharacter(char.id).length >= 3 && (
                      <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-red-500/20 text-red-500 text-sm">
                        <Skull className="w-5 h-5 shrink-0" />
                        <span className="font-body">
                          {t.complications.negativeMarkWarning}
                        </span>
                      </div>
                    )}

                    {/* Complications List */}
                    <ScrollArea className="flex-1">
                      <div className="space-y-3 pr-4">
                        {getComplicationsByCharacter(char.id).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="font-body text-sm">
                              Nenhuma complicação ativa
                            </p>
                          </div>
                        ) : (
                          getComplicationsByCharacter(char.id).map((comp) => {
                            const TypeIcon = typeIcons[comp.type] || AlertTriangle;
                            return (
                              <div
                                key={comp.id}
                                className="p-4 rounded-lg border border-border bg-card/50"
                              >
                                <div className="flex items-start gap-3">
                                  <TypeIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs">
                                        {t.complications[
                                          typeTranslationKeys[comp.type] as keyof typeof t.complications
                                        ] || comp.type}
                                      </Badge>
                                      {comp.is_visible ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-green-500/10 text-green-500 border-green-500/30"
                                        >
                                          <Eye className="w-3 h-3 mr-1" />
                                          Visível
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-muted text-muted-foreground"
                                        >
                                          <EyeOff className="w-3 h-3 mr-1" />
                                          Oculta
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-body text-foreground">
                                      {comp.description}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setEditModalOpen({
                                          complication: comp,
                                          characterName: char.name,
                                        })
                                      }
                                      title="Editar"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setManifestModalOpen({
                                          complication: comp,
                                          characterName: char.name,
                                        })
                                      }
                                    >
                                      <Sparkles className="w-4 h-4 mr-1" />
                                      {t.complications.manifest}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Edit Modal */}
      {editModalOpen && (
        <EditComplicationModal
          complication={editModalOpen.complication}
          characterName={editModalOpen.characterName}
          onClose={() => setEditModalOpen(null)}
          onUpdated={fetchComplications}
        />
      )}
    </>
  );
}
