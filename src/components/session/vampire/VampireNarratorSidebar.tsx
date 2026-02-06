import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';

// Discipline labels for i18n
const DISCIPLINE_LABELS: Record<string, { pt: string; en: string }> = {
  animalism: { pt: 'Animalismo', en: 'Animalism' },
  auspex: { pt: 'Auspícios', en: 'Auspex' },
  celerity: { pt: 'Celeridade', en: 'Celerity' },
  chimerstry: { pt: 'Quimerismo', en: 'Chimerstry' },
  dementation: { pt: 'Demência', en: 'Dementation' },
  dominate: { pt: 'Dominação', en: 'Dominate' },
  fortitude: { pt: 'Fortitude', en: 'Fortitude' },
  necromancy: { pt: 'Necromancia', en: 'Necromancy' },
  obfuscate: { pt: 'Ofuscação', en: 'Obfuscate' },
  obtenebration: { pt: 'Obtenebração', en: 'Obtenebration' },
  potence: { pt: 'Potência', en: 'Potence' },
  presence: { pt: 'Presença', en: 'Presence' },
  protean: { pt: 'Metamorfose', en: 'Protean' },
  quietus: { pt: 'Quietus', en: 'Quietus' },
  serpentis: { pt: 'Serpentis', en: 'Serpentis' },
  thaumaturgy: { pt: 'Taumaturgia', en: 'Thaumaturgy' },
  vicissitude: { pt: 'Vicissitude', en: 'Vicissitude' },
  daimonion: { pt: 'Daimonion', en: 'Daimonion' },
  melpominee: { pt: 'Melpominee', en: 'Melpominee' },
  mytherceria: { pt: 'Mytherceria', en: 'Mytherceria' },
  obeah: { pt: 'Obeah', en: 'Obeah' },
  sanguinus: { pt: 'Sanguinus', en: 'Sanguinus' },
  spiritus: { pt: 'Spiritus', en: 'Spiritus' },
  temporis: { pt: 'Temporis', en: 'Temporis' },
  thanatosis: { pt: 'Thanatosis', en: 'Thanatosis' },
  valeren: { pt: 'Valeren', en: 'Valeren' },
  visceratika: { pt: 'Visceratika', en: 'Visceratika' },
  flight: { pt: 'Voo', en: 'Flight' },
  bardo: { pt: 'Bardo', en: 'Bardo' },
  abombwe: { pt: 'Abombwe', en: 'Abombwe' },
};

const getDisciplineLabel = (key: string, lang: string) => {
  const label = DISCIPLINE_LABELS[key];
  return label ? (lang === 'pt-BR' ? label.pt : label.en) : key;
};
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import VampiroCharacterSheet from '@/components/character/vampiro/VampiroCharacterSheet';
import { TrackerChangeConfirmModal, TrackerType } from './TrackerChangeConfirmModal';
import {
  Crown,
  Users,
  Dices,
  Moon,
  Plus,
  Droplets,
  Sparkles,
  Heart,
  AlertTriangle,
  Skull,
  FileText,
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

interface PendingChange {
  type: TrackerType;
  currentValue: number;
  newValue: number;
  participantId: string;
  characterId?: string;
  characterName: string;
  isPermanent?: boolean;
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
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [showSceneForm, setShowSceneForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Participant['character'] | null>(null);

  // Confirmation modal state for narrator edits
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  // Handle tracker change request from narrator
  const requestTrackerChange = (
    type: TrackerType,
    currentValue: number,
    newValue: number,
    participantId: string,
    characterName: string,
    characterId?: string,
    isPermanent?: boolean
  ) => {
    setPendingChange({
      type,
      currentValue,
      newValue,
      participantId,
      characterId,
      characterName,
      isPermanent,
    });
    setIsConfirmOpen(true);
  };

  // Confirm the pending change
  const confirmChange = async () => {
    if (!pendingChange) return;

    try {
      // Handle humanity changes (permanent - update character record)
      if (pendingChange.type === 'humanity' && pendingChange.characterId) {
        // Fetch current vampiro_data
        const { data: charData, error: fetchError } = await supabase
          .from('characters')
          .select('vampiro_data')
          .eq('id', pendingChange.characterId)
          .single();

        if (fetchError) throw fetchError;

        // Update humanity in the object
        const updatedData = {
          ...(charData.vampiro_data as VampiroCharacterData),
          humanity: pendingChange.newValue,
        };

        // Save back to database
        const { error: updateError } = await supabase
          .from('characters')
          .update({ vampiro_data: updatedData })
          .eq('id', pendingChange.characterId);

        if (updateError) throw updateError;
      } else {
        // Handle session trackers (temporary)
        const updateData: Record<string, number | boolean[]> = {};
        
        switch (pendingChange.type) {
          case 'blood':
            updateData.session_blood_pool = pendingChange.newValue;
            break;
          case 'willpower':
            updateData.session_willpower_current = pendingChange.newValue;
            break;
          case 'health':
            const newHealth = Array(7).fill(false);
            for (let i = 0; i < pendingChange.newValue; i++) {
              newHealth[i] = true;
            }
            updateData.session_health_damage = newHealth;
            break;
        }

        await supabase
          .from('session_participants')
          .update(updateData)
          .eq('id', pendingChange.participantId);
      }

      // Emit event to session feed
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: currentScene?.id || null,
        event_type: 'tracker_change',
        event_data: {
          tracker_type: pendingChange.type,
          character_name: pendingChange.characterName,
          old_value: pendingChange.currentValue,
          new_value: pendingChange.newValue,
          is_narrator_change: true,
          is_permanent: pendingChange.isPermanent || false,
        },
      });

      toast({ title: 'Alteração salva' });
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }

    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  // Cancel the pending change
  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingChange(null);
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
            {t.vampiroTests.test}
          </Button>
        </CardContent>
      </Card>

      {/* Coterie (Players) */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-destructive" />
            Coterie
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
                const humanity = vampData?.humanity || 7;
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

                    {/* Disciplines Summary (read-only, sorted by level descending) */}
                    {vampData?.disciplines && Object.keys(vampData.disciplines).filter(k => (vampData.disciplines?.[k] || 0) > 0).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(vampData.disciplines)
                          .filter(([, v]) => v > 0)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-[10px] px-1.5 py-0">
                              {getDisciplineLabel(key, language)}: {value}
                            </Badge>
                          ))}
                        {Object.entries(vampData.disciplines).filter(([, v]) => v > 0).length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{Object.entries(vampData.disciplines).filter(([, v]) => v > 0).length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Interactive Trackers Row */}
                    {p.character && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {/* Blood Pool - Clickable */}
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = bloodPool > 0 ? bloodPool - 1 : 1;
                            requestTrackerChange('blood', bloodPool, newValue, p.id, p.character?.name || '');
                          }}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isBloodCritical 
                              ? 'bg-destructive/30 border-destructive' 
                              : 'bg-destructive/10 border-destructive/20'
                          }`}
                        >
                          {isBloodCritical ? (
                            <Skull className="w-3 h-3 text-destructive mb-0.5 animate-pulse" />
                          ) : (
                            <Droplets className="w-3 h-3 text-destructive mb-0.5" />
                          )}
                          <span className="font-medium text-destructive">{bloodPool}</span>
                          <span className="text-muted-foreground text-[10px]">Sangue</span>
                        </button>
                        
                        {/* Willpower - Clickable */}
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = currentWillpower > 0 ? currentWillpower - 1 : 1;
                            requestTrackerChange('willpower', currentWillpower, newValue, p.id, p.character?.name || '');
                          }}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isWillpowerCritical 
                              ? 'bg-amber-500/30 border-amber-500' 
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          {isWillpowerCritical ? (
                            <AlertTriangle className="w-3 h-3 text-amber-500 mb-0.5 animate-pulse" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-foreground mb-0.5" />
                          )}
                          <span className={`font-medium ${isWillpowerCritical ? 'text-amber-500' : ''}`}>
                            {currentWillpower}/{maxWillpower}
                          </span>
                          <span className="text-muted-foreground text-[10px]">Vontade</span>
                        </button>
                        
                        {/* Health - Clickable */}
                        <button
                          type="button"
                          onClick={() => {
                            const newDamagedLevels = damagedLevels < 7 ? damagedLevels + 1 : 0;
                            requestTrackerChange('health', damagedLevels, newDamagedLevels, p.id, p.character?.name || '');
                          }}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            damagedLevels >= 5 
                              ? 'bg-destructive/20 border-destructive/40' 
                              : damagedLevels >= 3 
                                ? 'bg-orange-500/10 border-orange-500/30' 
                                : 'bg-muted/50 border-border'
                          }`}
                        >
                          <Heart className={`w-3 h-3 mb-0.5 ${
                            damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : 'text-foreground'
                          }`} />
                          <span className={`font-medium ${
                            damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : ''
                          }`}>{7 - damagedLevels}/7</span>
                          <span className="text-muted-foreground text-[10px]">Vitalidade</span>
                        </button>
                      </div>
                    )}

                    {/* Humanity - Clickable (PERMANENT) */}
                    {p.character && (
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = humanity > 0 ? humanity - 1 : 1;
                          requestTrackerChange('humanity', humanity, newValue, p.id, p.character?.name || '', p.character?.id, true);
                        }}
                        className="flex items-center gap-2 p-1.5 rounded border bg-muted/50 border-border cursor-pointer transition-colors hover:bg-muted/70 w-full"
                      >
                        <Moon className="w-3 h-3 text-foreground" />
                        <span className="font-medium text-sm">{humanity}/10</span>
                        <span className="text-muted-foreground text-[10px] flex-1">Humanidade</span>
                        <span className="text-[8px] px-1 py-0.5 bg-destructive/20 text-destructive rounded">⚡</span>
                      </button>
                    )}

                    {/* View Character Sheet Button */}
                    {p.character && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCharacter(p.character)}
                        className="w-full mt-1 text-xs h-7"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Ver Ficha
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Character Sheet Modal */}
      <Dialog open={!!selectedCharacter} onOpenChange={(open) => !open && setSelectedCharacter(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Moon className="w-5 h-5 text-destructive" />
              Ficha de {selectedCharacter?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedCharacter && selectedCharacter.vampiro_data && (
              <VampiroCharacterSheet
                character={{
                  id: selectedCharacter.id,
                  name: selectedCharacter.name,
                  concept: selectedCharacter.concept,
                  vampiro_data: selectedCharacter.vampiro_data,
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tracker Change Confirmation Modal */}
      {pendingChange && (
        <TrackerChangeConfirmModal
          open={isConfirmOpen}
          trackerType={pendingChange.type}
          currentValue={pendingChange.currentValue}
          newValue={pendingChange.newValue}
          characterName={pendingChange.characterName}
          isNarrator={true}
          isPermanent={pendingChange.isPermanent}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      )}
    </div>
  );
}
