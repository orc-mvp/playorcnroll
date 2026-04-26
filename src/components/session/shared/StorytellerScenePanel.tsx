/**
 * StorytellerScenePanel — painel de cena unificado.
 *
 * Substitui os duplicados `VampireScenePanel` e `WerewolfScenePanel` (eram
 * praticamente idênticos, só mudava a cor temática). A cor é injetada via
 * adapter (`adapter.color`, `adapter.borderColor`).
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BookOpen, Plus, History, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StorytellerScene } from '@/lib/storyteller/types';

interface Props {
  sessionId: string;
  currentScene: StorytellerScene | null;
  scenes: StorytellerScene[];
  isNarrator: boolean;
  onSceneChange: (scene: StorytellerScene) => void;
  /** Cor do tema do sistema (ex: 'destructive', 'emerald-500'). */
  themeColor: string;
}

export function StorytellerScenePanel({
  sessionId,
  currentScene,
  scenes,
  isNarrator,
  onSceneChange,
  themeColor,
}: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [showNewScene, setShowNewScene] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  const previousScenes = scenes.filter((s) => s.id !== currentScene?.id);

  const borderClass = `border-${themeColor}/20`;
  const textClass = `text-${themeColor}`;
  const hoverBgClass = `hover:bg-${themeColor}/10`;
  const borderHoverClass = `border-${themeColor}/30`;
  const buttonBgClass = `bg-${themeColor} hover:bg-${themeColor}/90`;

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return;
    setIsCreating(true);
    try {
      if (currentScene) {
        await supabase.from('scenes').update({ is_active: false }).eq('id', currentScene.id);
      }
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

      await supabase
        .from('sessions')
        .update({ current_scene_id: scene.id })
        .eq('id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: scene.id,
        event_type: 'scene_started',
        event_data: { scene_name: scene.name, scene_description: scene.description },
      });

      toast({ title: t.vampireSession.sceneCreated });
      setNewSceneName('');
      setNewSceneDesc('');
      setShowNewScene(false);
      onSceneChange(scene as StorytellerScene);
    } catch {
      toast({ title: t.vampireSession.errorCreatingScene, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className={cn('medieval-card', borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn('font-medieval flex items-center gap-2', textClass)}>
            <BookOpen className="w-5 h-5" />
            {t.vampireSession.currentScene}
          </CardTitle>
          {isNarrator && (
            <Button
              size="sm"
              variant="outline"
              className={cn(borderHoverClass, hoverBgClass)}
              onClick={() => setShowNewScene(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {t.vampireSession.newScene}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentScene ? (
          <div className="space-y-2">
            <h3 className="font-medieval text-lg">{currentScene.name}</h3>
            {currentScene.description && (
              <p className="text-muted-foreground font-body text-sm">
                {currentScene.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 font-body">
            {t.vampireSession.noActiveScene}
          </p>
        )}

        {showNewScene && isNarrator && (
          <div className="space-y-2 pt-3 border-t border-border">
            <Input
              placeholder={t.vampireSession.sceneName}
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder={t.vampireSession.descriptionOptional}
              value={newSceneDesc}
              onChange={(e) => setNewSceneDesc(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateScene}
                disabled={!newSceneName.trim() || isCreating}
                className={cn('flex-1', buttonBgClass)}
              >
                {t.common.create}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewScene(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {previousScenes.length > 0 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  {t.vampireSession.previousScenes} ({previousScenes.length})
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showHistory ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 pt-2">
                {previousScenes.map((scene) => (
                  <div key={scene.id}>
                    <button
                      onClick={() =>
                        setExpandedSceneId(expandedSceneId === scene.id ? null : scene.id)
                      }
                      className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-muted/50 text-sm"
                    >
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate flex-1">{scene.name}</span>
                    </button>
                    {expandedSceneId === scene.id && scene.description && (
                      <p className="px-2 pb-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {scene.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
