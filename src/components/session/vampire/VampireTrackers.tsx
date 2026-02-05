import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Sparkles, Heart, AlertTriangle } from 'lucide-react';

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

interface VampireTrackersProps {
  participantId: string;
  character: {
    id: string;
    name: string;
    vampiro_data: VampiroCharacterData | null;
  } | null;
  initialBloodPool?: number;
  initialWillpower?: number;
  initialHealthDamage?: boolean[];
}

const HEALTH_LEVELS = [
  'bruised',
  'hurt',
  'injured',
  'wounded',
  'mauled',
  'crippled',
  'incapacitated',
] as const;

export function VampireTrackers({
  participantId,
  character,
  initialBloodPool = 0,
  initialWillpower = 0,
  initialHealthDamage = [false, false, false, false, false, false, false],
}: VampireTrackersProps) {
  const t = useTranslation();
  const { toast } = useToast();

  const vampiroData = character?.vampiro_data;
  const maxWillpower = vampiroData?.willpower || 1;

  const [bloodPool, setBloodPool] = useState(initialBloodPool);
  const [currentWillpower, setCurrentWillpower] = useState(initialWillpower);
  const [healthDamage, setHealthDamage] = useState<boolean[]>(initialHealthDamage);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced save to database
  const saveTrackers = useCallback(
    async (blood: number, willpower: number, health: boolean[]) => {
      setIsSaving(true);
      try {
        await supabase
          .from('session_participants')
          .update({
            session_blood_pool: blood,
            session_willpower_current: willpower,
            session_health_damage: health,
          })
          .eq('id', participantId);
      } catch (error) {
        console.error('Error saving trackers:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [participantId]
  );

  // Save after changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveTrackers(bloodPool, currentWillpower, healthDamage);
    }, 500);

    return () => clearTimeout(timer);
  }, [bloodPool, currentWillpower, healthDamage, saveTrackers]);

  const toggleBloodPoint = (index: number) => {
    if (index < bloodPool) {
      setBloodPool(index);
    } else {
      setBloodPool(index + 1);
    }
  };

  const toggleWillpowerPoint = (index: number) => {
    if (index < currentWillpower) {
      setCurrentWillpower(index);
    } else {
      setCurrentWillpower(index + 1);
    }
  };

  const toggleHealthLevel = (index: number) => {
    setHealthDamage((prev) => {
      const newHealth = [...prev];
      newHealth[index] = !newHealth[index];
      return newHealth;
    });
  };

  if (!character) {
    return (
      <Card className="medieval-card border-destructive/20">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum personagem selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Blood Pool */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-destructive">
            <Droplets className="w-4 h-4" />
            {t.vampiro.bloodPool}
            {isSaving && (
              <span className="text-xs text-muted-foreground ml-auto animate-pulse">
                ...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Array.from({ length: 5 }, (_, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {Array.from({ length: 10 }, (_, colIndex) => {
                  const index = rowIndex * 10 + colIndex;
                  const isFilled = index < bloodPool;
                  return (
                    <button
                      key={colIndex}
                      type="button"
                      onClick={() => toggleBloodPoint(index)}
                      className={`w-3 h-3 rounded-sm border transition-colors cursor-pointer hover:border-destructive ${
                        isFilled
                          ? 'bg-destructive border-destructive'
                          : 'border-destructive/40 bg-destructive/10'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {bloodPool}/50
          </p>
        </CardContent>
      </Card>

      {/* Willpower */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-destructive" />
            {t.vampiro.willpowerCurrent}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 justify-center">
            {Array.from({ length: maxWillpower }, (_, i) => {
              const isFilled = i < currentWillpower;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWillpowerPoint(i)}
                  className={`w-4 h-4 rounded border-2 transition-colors cursor-pointer hover:border-foreground ${
                    isFilled
                      ? 'bg-foreground border-foreground'
                      : 'border-muted-foreground/40 bg-transparent'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {currentWillpower}/{maxWillpower}
          </p>
        </CardContent>
      </Card>

      {/* Health Tracker */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            {t.vampiro.healthLevels}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {HEALTH_LEVELS.map((level, index) => {
              const isDamaged = healthDamage[index];
              const levelLabel = t.vampiro[level] || level;
              // Penalties: bruised=0, hurt=-1, injured=-1, wounded=-2, mauled=-2, crippled=-5
              const penalties = [0, -1, -1, -2, -2, -5, '—'];
              
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleHealthLevel(index)}
                  className={`w-full flex items-center justify-between p-1.5 rounded text-sm transition-colors ${
                    isDamaged
                      ? 'bg-destructive/20 border border-destructive/40'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className={isDamaged ? 'text-destructive' : 'text-muted-foreground'}>
                    {levelLabel}
                  </span>
                  <span className={`text-xs ${isDamaged ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {penalties[index]}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Disciplines */}
      {vampiroData?.disciplines && Object.keys(vampiroData.disciplines).length > 0 && (
        <Card className="medieval-card border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-medieval text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-destructive" />
              {t.vampiro.disciplines}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(vampiroData.disciplines).map(([key, value]) =>
                value > 0 ? (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="font-body capitalize">
                      {t.vampiro[key as keyof typeof t.vampiro] || key}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < value
                              ? 'bg-destructive'
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
