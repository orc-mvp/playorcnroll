/**
 * StorytellerTestRequestModal — modal unificado de pedido de teste do narrador.
 *
 * Substitui `VampireTestRequestModal` e `WerewolfTestRequestModal` no fluxo do
 * narrador. Lê `testCategories` de cada adapter para decidir o que mostrar:
 *  - Alvos do mesmo sistema → todas as categorias daquele adapter.
 *  - Alvos de sistemas diferentes → apenas categorias com `crossSystem: true`.
 *
 * Emite payload compatível com `VampirePendingTest` (`event_type`:
 * `vampire_test_requested`), o mesmo que ambos os modais antigos usavam.
 */

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dices,
  Lock,
  Heart,
  Star,
  Users,
  ChevronRight,
  MessageSquare,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  STORYTELLER_ATTRIBUTES,
  STORYTELLER_ABILITIES,
} from '@/lib/storyteller/traits';
import {
  getSystemAdapter,
  isStorytellerSystem,
} from '@/lib/storyteller/systemRegistry';
import type {
  StorytellerParticipant,
  TestCategoryDef,
} from '@/lib/storyteller/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: StorytellerParticipant[];
  /** Recebe o payload pronto para `session_events` (compatível com `VampirePendingTest`). */
  onRequestTest: (config: TestPayload) => void;
}

export interface TestPayload {
  testType: string;
  attribute?: string;
  ability?: string;
  virtue?: string;
  diceCount?: number;
  difficulty: number;
  context: string;
  isPrivate: boolean;
  applyHealthPenalty: boolean;
  isSpecialized: boolean;
  targetCharacterIds: string[];
}

const ALL_ATTRIBUTES = [
  ...STORYTELLER_ATTRIBUTES.physical.items,
  ...STORYTELLER_ATTRIBUTES.social.items,
  ...STORYTELLER_ATTRIBUTES.mental.items,
];

const VIRTUES = [
  { key: 'conscience', label: 'Consciência' },
  { key: 'conviction', label: 'Convicção' },
  { key: 'selfControl', label: 'Autocontrole' },
  { key: 'instinct', label: 'Instinto' },
  { key: 'courage', label: 'Coragem' },
];

export default function StorytellerTestRequestModal({
  open,
  onOpenChange,
  participants,
  onRequestTest,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('attribute_ability');
  const [attribute, setAttribute] = useState('');
  const [ability, setAbility] = useState('');
  const [virtue, setVirtue] = useState('');
  const [diceCount, setDiceCount] = useState(1);
  const [difficulty, setDifficulty] = useState(6);
  const [context, setContext] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [applyHealthPenalty, setApplyHealthPenalty] = useState(false);
  const [isSpecialized, setIsSpecialized] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const playersWithCharacters = participants.filter(
    (p) => p.character_id && p.character && isStorytellerSystem(p.character.game_system),
  );

  // ----- Sistemas distintos entre os alvos selecionados -----
  const targetSystems = useMemo(() => {
    const ids = selectAll
      ? playersWithCharacters.map((p) => p.character_id!)
      : selectedPlayers;
    const systems = new Set<string>();
    for (const id of ids) {
      const p = playersWithCharacters.find((pp) => pp.character_id === id);
      if (p?.character) systems.add(p.character.game_system);
    }
    return Array.from(systems);
  }, [selectAll, selectedPlayers, playersWithCharacters]);

  const isCrossSystem = targetSystems.length > 1;
  const noTargets = targetSystems.length === 0;

  // ----- Categorias de teste disponíveis -----
  // Mesmo sistema: todas as categorias daquele adapter.
  // Cross-system: união das categorias `crossSystem: true` (deduplicada por id).
  // Nenhum alvo: categorias do primeiro sistema disponível, só pra UI não ficar vazia.
  const availableCategories: TestCategoryDef[] = useMemo(() => {
    if (noTargets) {
      // Mostramos um catálogo mínimo cross-system pra UI não ficar vazia.
      const seen = new Map<string, TestCategoryDef>();
      for (const sys of ['vampiro_v3', 'lobisomem_w20']) {
        for (const cat of getSystemAdapter(sys).testCategories) {
          if (cat.crossSystem && !seen.has(cat.id)) seen.set(cat.id, cat);
        }
      }
      return Array.from(seen.values());
    }
    if (isCrossSystem) {
      const seen = new Map<string, TestCategoryDef>();
      for (const sys of targetSystems) {
        for (const cat of getSystemAdapter(sys).testCategories) {
          if (cat.crossSystem && !seen.has(cat.id)) seen.set(cat.id, cat);
        }
      }
      return Array.from(seen.values());
    }
    // Mesmo sistema
    return getSystemAdapter(targetSystems[0]).testCategories;
  }, [targetSystems, isCrossSystem, noTargets]);

  const selectedCategory =
    availableCategories.find((c) => c.id === selectedCategoryId) ??
    availableCategories[0];

  // Se a categoria selecionada some (mudança de alvos cross/mono), realinha.
  useMemoEffect(() => {
    if (selectedCategory && selectedCategory.id !== selectedCategoryId) {
      setSelectedCategoryId(selectedCategory.id);
      setAttribute('');
      setAbility('');
      setVirtue('');
    }
  }, [selectedCategory?.id]);

  const togglePlayer = (characterId: string) => {
    if (selectAll) {
      const allIds = playersWithCharacters.map((p) => p.character_id!).filter(Boolean);
      setSelectedPlayers(allIds.filter((id) => id !== characterId));
      setSelectAll(false);
    } else {
      setSelectedPlayers((prev) => {
        const next = prev.includes(characterId)
          ? prev.filter((id) => id !== characterId)
          : [...prev, characterId];
        if (next.length === playersWithCharacters.length) {
          setSelectAll(true);
          return [];
        }
        return next;
      });
    }
  };

  const isValid = () => {
    if (!selectedCategory) return false;
    if (selectedCategory.requiresAttribute && !attribute) return false;
    if (selectedCategory.requiresAbility && !ability) return false;
    if (selectedCategory.requiresVirtue && !virtue) return false;
    const targetCount = selectAll ? playersWithCharacters.length : selectedPlayers.length;
    return targetCount > 0;
  };

  const handleSubmit = () => {
    if (!selectedCategory || !isValid()) return;
    const targetIds = selectAll
      ? playersWithCharacters.map((p) => p.character_id!).filter(Boolean)
      : selectedPlayers;

    const payload: TestPayload = {
      testType: selectedCategory.testType,
      attribute: selectedCategory.requiresAttribute ? attribute : undefined,
      ability: selectedCategory.requiresAbility ? ability : undefined,
      virtue: selectedCategory.requiresVirtue ? virtue : undefined,
      diceCount: selectedCategory.requiresDiceCount ? diceCount : undefined,
      difficulty,
      context,
      isPrivate,
      applyHealthPenalty,
      isSpecialized,
      targetCharacterIds: targetIds,
    };

    onRequestTest(payload);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setAttribute('');
    setAbility('');
    setVirtue('');
    setDiceCount(1);
    setDifficulty(6);
    setContext('');
    setIsPrivate(false);
    setApplyHealthPenalty(false);
    setIsSpecialized(false);
    setSelectedPlayers([]);
    setSelectAll(false);
    setContextOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            Pedir Teste
          </DialogTitle>
          <DialogDescription>
            Dificuldade padrão 6. Use {`+/-`} para ajustar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Player selection FIRST — define o catálogo disponível */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Selecionar jogadores</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectAll(true);
                  setSelectedPlayers([]);
                }}
                className={cn(
                  'min-h-[44px] md:min-h-[36px] text-xs',
                  selectAll && 'bg-primary/20 border-primary text-primary hover:bg-primary/30',
                )}
              >
                Todos
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                  {playersWithCharacters.length}
                </Badge>
              </Button>
              {playersWithCharacters.map((p) => {
                const isSelected = selectAll || selectedPlayers.includes(p.character_id!);
                const adapter = getSystemAdapter(p.character!.game_system);
                return (
                  <Button
                    key={p.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => togglePlayer(p.character_id!)}
                    className={cn(
                      'min-h-[44px] md:min-h-[36px] text-xs gap-1.5',
                      isSelected &&
                        'bg-primary/20 border-primary text-primary hover:bg-primary/30',
                    )}
                  >
                    {p.character?.name || 'Sem nome'}
                    <Badge
                      variant="outline"
                      className={cn('text-[9px] px-1 py-0 h-4', adapter.color)}
                    >
                      {adapter.shortLabel}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            {isCrossSystem && (
              <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Alvos de sistemas diferentes ({targetSystems
                    .map((s) => getSystemAdapter(s).shortLabel)
                    .join(', ')}). Apenas testes universais ficam disponíveis.
                </span>
              </div>
            )}
          </div>

          {/* Test type — derivado dos sistemas dos alvos */}
          <div className="flex flex-wrap gap-1.5">
            {availableCategories.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setAttribute('');
                  setAbility('');
                  setVirtue('');
                }}
                className={cn(
                  'min-h-[36px] text-xs',
                  selectedCategoryId === cat.id &&
                    'bg-primary/20 border-primary text-primary hover:bg-primary/30',
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Attribute selector */}
          {selectedCategory?.requiresAttribute && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Atributo</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_ATTRIBUTES.map((attr) => (
                  <Button
                    key={attr.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAttribute(attr.key)}
                    className={cn(
                      'min-h-[44px] text-xs font-medium',
                      attribute === attr.key &&
                        'bg-primary/20 border-primary text-primary hover:bg-primary/30',
                    )}
                  >
                    {attr.label['pt-BR']}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Ability selector — agrupado por categoria */}
          {selectedCategory?.requiresAbility && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Habilidade</Label>
              {(['talents', 'skills', 'knowledges'] as const).map((cat) => (
                <div key={cat}>
                  <span className="text-[10px] font-medieval text-muted-foreground/70 uppercase tracking-wider">
                    {STORYTELLER_ABILITIES[cat].label['pt-BR']}
                  </span>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-1 mt-0.5">
                    {STORYTELLER_ABILITIES[cat].items.map((ab) => (
                      <Button
                        key={ab.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAbility(ab.key)}
                        className={cn(
                          'min-h-[44px] md:min-h-[36px] text-[10px] md:text-xs font-medium px-1.5',
                          ability === ab.key &&
                            'bg-primary/20 border-primary text-primary hover:bg-primary/30',
                        )}
                      >
                        {ab.label['pt-BR']}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Virtue selector */}
          {selectedCategory?.requiresVirtue && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Virtude</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {VIRTUES.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVirtue(v.key)}
                    className={cn(
                      'min-h-[44px] text-xs font-medium',
                      virtue === v.key &&
                        'bg-primary/20 border-primary text-primary hover:bg-primary/30',
                    )}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Raw dice count */}
          {selectedCategory?.requiresDiceCount && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dados a rolar</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                  disabled={diceCount <= 1}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-2xl font-bold w-10 text-center font-medieval">
                  {diceCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setDiceCount(Math.min(20, diceCount + 1))}
                  disabled={diceCount >= 20}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div className="flex items-center gap-3">
            <Label className="text-sm whitespace-nowrap">Dificuldade:</Label>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setDifficulty(Math.max(2, difficulty - 1))}
              disabled={difficulty <= 2}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <span className="text-2xl font-bold w-10 text-center font-medieval">{difficulty}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setDifficulty(Math.min(10, difficulty + 1))}
              disabled={difficulty >= 10}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Context (optional) */}
          <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-8"
              >
                <ChevronRight
                  className={cn('w-4 h-4 transition-transform', contextOpen && 'rotate-90')}
                />
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">Adicionar contexto (opcional)</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                placeholder="Ex.: tentativa de escalar um muro escorregadio..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
            <ToggleRow
              icon={<Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              label="Teste privado"
              checked={isPrivate}
              onChange={setIsPrivate}
              id="private"
            />
            <ToggleRow
              icon={<Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              label="Aplicar penalidade de Vitalidade"
              checked={applyHealthPenalty}
              onChange={setApplyHealthPenalty}
              id="health"
            />
            <div className="md:col-span-2">
              <ToggleRow
                icon={<Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                label="Teste especializado (10s explodem)"
                checked={isSpecialized}
                onChange={setIsSpecialized}
                id="specialized"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid()}
            className="bg-primary hover:bg-primary/90 text-sm"
          >
            <Dices className="w-4 h-4 mr-1" />
            Enviar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Helpers locais -----

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <Label htmlFor={id} className="font-normal cursor-pointer text-sm truncate">
          {label}
        </Label>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * Mini-helper que combina `useMemo` + side effect — usado para sincronizar
 * `selectedCategoryId` quando a lista de categorias disponíveis muda.
 */
function useMemoEffect(fn: () => void, deps: React.DependencyList) {
  const prev = useMemo(() => ({ deps }), []);
  if (deps.some((d, i) => d !== (prev.deps as any)[i])) {
    prev.deps = deps as any;
    fn();
  }
}
