import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crown,
  Users,
  Dices,
  Moon,
  BookOpen,
  Plus,
  Play,
  Droplets,
  Sparkles,
  Heart,
} from 'lucide-react';

interface VampiroCharacterData {
  player?: string;
  chronicle?: string;
  clan?: string;
  generation?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  disciplines?: Record<string, number>;
  humanity?: number;
  willpower?: number;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    vampiro_data: VampiroCharacterData | null;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

interface Scene {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  session_id: string;
}

interface VampireNarratorSidebarProps {
  sessionId: string;
  participants: Participant[];
  scenes: Scene[];
  currentScene: Scene | null;
  onRequestTest: () => void;
  onSceneChange: (scene: Scene) => void;
}

export function VampireNarratorSidebar({
  sessionId,
  participants,
  scenes,
  currentScene,
  onRequestTest,
  onSceneChange,
}: VampireNarratorSidebarProps) {
  const t = useTranslation();
  const { toast } = useToast();

  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [showSceneForm, setShowSceneForm] = useState(false);

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return;

    setIsCreatingScene(true);

    try {
      // Deactivate current scene if any
      if (currentScene) {
        await supabase
          .from('scenes')
          .update({ is_active: false })
          .eq('id', currentScene.id);
      }

      // Create new scene
      const { data: scene, error } = await supabase
        .from('scenes')
        .insert({
          session_id: sessionId,
          name: newSceneName.trim(),
          description: newSceneDesc.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session with current scene
      await supabase
        .from('sessions')
        .update({ current_scene_id: scene.id })
        .eq('id', sessionId);

      // Add event to feed
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: scene.id,
        event_type: 'scene_started',
        event_data: {
          scene_name: scene.name,
          scene_description: scene.description,
        },
      });

      toast({ title: t.vampiroTests.result || 'Cena criada!' });
      setNewSceneName('');
      setNewSceneDesc('');
      setShowSceneForm(false);
      onSceneChange(scene);
    } catch (error) {
      toast({ title: 'Erro ao criar cena', variant: 'destructive' });
    } finally {
      setIsCreatingScene(false);
    }
  };

  const handleActivateScene = async (scene: Scene) => {
    if (scene.id === currentScene?.id) return;

    try {
      // Deactivate all scenes
      await supabase
        .from('scenes')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      // Activate selected scene
      await supabase
        .from('scenes')
        .update({ is_active: true })
        .eq('id', scene.id);

      // Update session
      await supabase
        .from('sessions')
        .update({ current_scene_id: scene.id })
        .eq('id', sessionId);

      // Add event
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: scene.id,
        event_type: 'scene_changed',
        event_data: {
          scene_name: scene.name,
        },
      });

      onSceneChange(scene);
    } catch (error) {
      toast({ title: 'Erro ao trocar cena', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Narrator Badge */}
      <div className="flex items-center gap-2 text-destructive">
        <Crown className="w-5 h-5" />
        <span className="font-medieval">{t.roles.narrator}</span>
      </div>

      {/* Request Test Card */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Dices className="w-4 h-4 text-destructive" />
            {t.vampiroTests.requestTest}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onRequestTest}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            <Dices className="w-4 h-4 mr-2" />
            {t.vampiroTests.configureTest}
          </Button>
        </CardContent>
      </Card>

      {/* Scene Management */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-destructive" />
            Cenas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Scene */}
          {currentScene && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="font-medieval text-sm text-destructive">
                {currentScene.name}
              </p>
              {currentScene.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentScene.description}
                </p>
              )}
            </div>
          )}

          {/* Scene List */}
          {scenes.length > 1 && (
            <ScrollArea className="h-24">
              <div className="space-y-1">
                {scenes
                  .filter((s) => s.id !== currentScene?.id)
                  .map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => handleActivateScene(scene)}
                      className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-muted/50 text-sm"
                    >
                      <Play className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{scene.name}</span>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          )}

          {/* New Scene Form */}
          {showSceneForm ? (
            <div className="space-y-2 pt-2 border-t border-border">
              <Input
                placeholder="Nome da cena"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                className="text-sm"
              />
              <Textarea
                placeholder="Descrição"
                value={newSceneDesc}
                onChange={(e) => setNewSceneDesc(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateScene}
                  disabled={!newSceneName.trim() || isCreatingScene}
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                >
                  {t.common.create}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSceneForm(false)}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowSceneForm(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Nova Cena
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Coterie (Players) */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-destructive" />
            Coterie
            <Badge variant="secondary" className="text-xs ml-auto">
              {participants.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum jogador conectado
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => {
                const vampData = p.character?.vampiro_data;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <Moon className="w-4 h-4 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medieval text-sm truncate">
                        {p.character?.name || 'Sem personagem'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {vampData?.clan && (
                          <span className="capitalize">{vampData.clan}</span>
                        )}
                        {vampData?.generation && (
                          <>
                            <span>•</span>
                            <span>{vampData.generation}ª Geração</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Quick Stats */}
                    {vampData && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5" title="Humanidade">
                          <Heart className="w-3 h-3 text-destructive" />
                          <span className="text-xs">{vampData.humanity || '?'}</span>
                        </div>
                        <div className="flex items-center gap-0.5" title="Força de Vontade">
                          <Sparkles className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{vampData.willpower || '?'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
