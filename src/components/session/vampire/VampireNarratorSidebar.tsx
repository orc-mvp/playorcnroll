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
  AlertTriangle,
  Skull,
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
  session_blood_pool?: number;
  session_willpower_current?: number;
  session_health_damage?: boolean[];
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
            <div className="space-y-3">
              {participants.map((p) => {
                const vampData = p.character?.vampiro_data;
                const maxWillpower = vampData?.willpower || 1;
                const bloodPool = p.session_blood_pool || 0;
                const currentWillpower = p.session_willpower_current || 0;
                const healthDamage = p.session_health_damage || [];
                const damagedLevels = healthDamage.filter(Boolean).length;
                
                // Critical state detection
                const isBloodCritical = bloodPool === 0;
                const isWillpowerCritical = currentWillpower === 0;
                const hasCriticalState = isBloodCritical || isWillpowerCritical;
                
                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg space-y-2 ${
                      hasCriticalState 
                        ? 'bg-destructive/20 border border-destructive/40 animate-pulse' 
                        : 'bg-muted/30'
                    }`}
                  >
                    {/* Critical State Badge */}
                    {hasCriticalState && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        CRÍTICO
                      </Badge>
                    )}

                    {/* Character Name & Clan */}
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medieval text-sm truncate">
                          {p.character?.name || 'Sem personagem'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {vampData?.clan || ''}
                          {vampData?.generation && ` • ${vampData.generation}ª Geração`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Trackers Row */}
                    {p.character && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {/* Blood Pool */}
                        <div className={`flex flex-col items-center p-1.5 rounded border ${
                          isBloodCritical 
                            ? 'bg-destructive/30 border-destructive' 
                            : 'bg-destructive/10 border-destructive/20'
                        }`}>
                          {isBloodCritical ? (
                            <Skull className="w-3 h-3 text-destructive mb-0.5 animate-pulse" />
                          ) : (
                            <Droplets className="w-3 h-3 text-destructive mb-0.5" />
                          )}
                          <span className="font-medium text-destructive">{bloodPool}</span>
                          <span className="text-muted-foreground text-[10px]">Sangue</span>
                        </div>
                        
                        {/* Willpower */}
                        <div className={`flex flex-col items-center p-1.5 rounded border ${
                          isWillpowerCritical 
                            ? 'bg-amber-500/30 border-amber-500' 
                            : 'bg-muted/50 border-border'
                        }`}>
                          {isWillpowerCritical ? (
                            <AlertTriangle className="w-3 h-3 text-amber-500 mb-0.5 animate-pulse" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-foreground mb-0.5" />
                          )}
                          <span className={`font-medium ${isWillpowerCritical ? 'text-amber-500' : ''}`}>
                            {currentWillpower}/{maxWillpower}
                          </span>
                          <span className="text-muted-foreground text-[10px]">Vontade</span>
                        </div>
                        
                        {/* Health */}
                        <div className={`flex flex-col items-center p-1.5 rounded border ${
                          damagedLevels >= 5 
                            ? 'bg-destructive/20 border-destructive/40' 
                            : damagedLevels >= 3 
                              ? 'bg-orange-500/10 border-orange-500/30' 
                              : 'bg-muted/50 border-border'
                        }`}>
                          <Heart className={`w-3 h-3 mb-0.5 ${
                            damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : 'text-foreground'
                          }`} />
                          <span className={`font-medium ${
                            damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : ''
                          }`}>{7 - damagedLevels}/7</span>
                          <span className="text-muted-foreground text-[10px]">Vitalidade</span>
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
