import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Crown, 
  Users, 
  Dices, 
  User,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame
} from 'lucide-react';
import type { SessionData, Participant, Scene } from '@/pages/Session';

interface NarratorSidebarProps {
  session: SessionData;
  participants: Participant[];
  currentScene: Scene | null;
}

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

const attributeKeys = ['aggression', 'determination', 'seduction', 'cunning', 'faith'] as const;

export function NarratorSidebar({ session, participants, currentScene }: NarratorSidebarProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isRequestingTest, setIsRequestingTest] = useState(false);

  const handleRequestTest = async () => {
    if (!selectedAttribute || selectedPlayers.length === 0 || !currentScene) {
      toast({
        title: 'Selecione atributo e jogadores',
        variant: 'destructive',
      });
      return;
    }

    setIsRequestingTest(true);

    try {
      // Create test
      const { data: test, error } = await supabase
        .from('tests')
        .insert({
          session_id: session.id,
          scene_id: currentScene.id,
          attribute: selectedAttribute,
          test_type: selectedPlayers.length > 1 ? 'group' : 'individual',
          created_by: session.narrator_id,
          difficulty: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Add event
      await supabase.from('session_events').insert({
        session_id: session.id,
        scene_id: currentScene.id,
        event_type: 'test_requested',
        event_data: {
          test_id: test.id,
          attribute: selectedAttribute,
          players: selectedPlayers,
        },
      });

      toast({ title: 'Teste solicitado!', duration: 2000 });
      setSelectedAttribute('');
      setSelectedPlayers([]);
    } catch (error: any) {
      toast({ title: 'Erro ao solicitar teste', variant: 'destructive' });
    } finally {
      setIsRequestingTest(false);
    }
  };

  const togglePlayer = (charId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(charId)
        ? prev.filter((id) => id !== charId)
        : [...prev, charId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Narrator Badge */}
      <div className="flex items-center gap-2 text-primary">
        <Crown className="w-5 h-5" />
        <span className="font-medieval">{t.roles.narrator}</span>
      </div>

      {/* Request Test Card */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Dices className="w-4 h-4 text-primary" />
            {t.tests.request}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attribute Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medieval text-muted-foreground">
              {t.tests.selectAttribute}
            </label>
            <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
              <SelectTrigger className="font-body">
                <SelectValue placeholder="Escolha o atributo" />
              </SelectTrigger>
              <SelectContent>
                {attributeKeys.map((attr) => {
                  const Icon = attributeIcons[attr];
                  return (
                    <SelectItem key={attr} value={attr}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{t.attributes[attr]}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Player Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medieval text-muted-foreground">
              {t.tests.selectPlayers}
            </label>
            <div className="space-y-2">
              {participants.map((p) => {
                if (!p.character) return null;
                const isSelected = selectedPlayers.includes(p.character.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.character!.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medieval text-sm flex-1">
                      {p.character.name}
                    </span>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Button */}
          <Button
            className="w-full font-medieval"
            onClick={handleRequestTest}
            disabled={!selectedAttribute || selectedPlayers.length === 0 || !currentScene || isRequestingTest}
          >
            <Dices className="w-4 h-4 mr-2" />
            {t.tests.request}
          </Button>

          {!currentScene && (
            <p className="text-xs text-muted-foreground text-center">
              Crie uma cena primeiro
            </p>
          )}
        </CardContent>
      </Card>

      {/* Connected Players */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t.session.connectedPlayers}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum jogador conectado
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <User className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medieval text-sm truncate">
                      {p.character?.name || 'Sem personagem'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.profile?.display_name || 'Jogador'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
