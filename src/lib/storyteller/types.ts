/**
 * Storyteller System Adapter — tipos compartilhados
 *
 * Tipos comuns aos quatro sistemas WoD suportados pela sala Storyteller:
 * Vampiro V3, Lobisomem W20, Mago M20 e Metamorfos (W20).
 *
 * A página `StorytellerSession` consome o registry e renderiza dinamicamente
 * trackers, ficha e modais do sistema de cada personagem individualmente.
 */

import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Identificador de sistema WoD suportado pela sala unificada Storyteller */
export type StorytellerSystemId =
  | 'vampiro_v3'
  | 'lobisomem_w20'
  | 'mago_m20'
  | 'metamorfos_w20';

/** Participante simplificado — campos session_* são preenchidos sob demanda por sistema */
export interface StorytellerParticipant {
  id: string;
  user_id: string;
  character_id: string | null;
  sheet_locked?: boolean;
  experience_points?: number;
  /** Pool de sangue (Vampiro) */
  session_blood_pool?: number;
  /** Willpower atual (todos os sistemas WoD) */
  session_willpower_current?: number;
  /** Dano em vitalidade — array de 7 booleanos (todos os sistemas WoD) */
  session_health_damage?: boolean[] | null;
  /** Gnose (Lobisomem) */
  session_gnosis?: number;
  /** Fúria (Lobisomem) */
  session_rage?: number;
  /** Forma atual (Lobisomem) */
  session_form?: string;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    // Mantido como `vampiro_data` no banco — historicamente usado para qualquer
    // sistema WoD. Cada adapter sabe interpretar este blob.
    vampiro_data: any;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

/** Cena da sessão — comum a todos os sistemas */
export interface StorytellerScene {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  session_id: string;
}

/** Evento da sessão — comum a todos os sistemas */
export interface StorytellerEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  scene_id: string | null;
  session_id: string;
}

/** Sessão — comum a todos os sistemas */
export interface StorytellerSessionData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  narrator_id: string;
  status: string;
  current_scene_id: string | null;
  game_system: string;
}

/**
 * Definição de um tracker exibido no card do personagem na sidebar do narrador.
 * Cada sistema declara seus trackers no adapter.
 */
export interface TrackerDef {
  /** Chave única do tracker (interno) */
  key: string;
  /** Label em pt-BR (sem i18n — termos de regra ficam em português) */
  label: string;
  /** Ícone lucide */
  icon: LucideIcon;
  /** Cor temática (tailwind class), ex: 'text-destructive' */
  color: string;
  /** Calcula valor máximo do tracker a partir do `vampiro_data` do personagem */
  getMax: (charData: any) => number;
  /** Lê valor atual no participante */
  getCurrent: (participant: StorytellerParticipant) => number;
  /** Renderização especial: vitalidade (7 níveis) */
  isHealth?: boolean;
}

/**
 * Inicializadores de tracker — chamados quando o participante entra na sala
 * pela primeira vez (todos os valores zerados). Retorna patch para gravar
 * em `session_participants`.
 */
export type TrackerInitializer = (
  participant: StorytellerParticipant,
) => Partial<StorytellerParticipant> | null;

/**
 * Adapter completo de um sistema WoD.
 * Adicionar um novo sistema = criar um adapter e registrá-lo no registry.
 */
export interface SystemAdapter {
  id: StorytellerSystemId;
  /** Nome curto para badges (ex: 'Vampiro') */
  shortLabel: string;
  /** Nome completo (ex: 'Vampiro: A Máscara') */
  fullLabel: string;
  /** Ícone lucide do sistema */
  icon: LucideIcon;
  /** Classe tailwind de cor temática (ex: 'text-destructive', 'text-emerald-500') */
  color: string;
  /** Classe tailwind de borda temática (ex: 'border-destructive/20') */
  borderColor: string;
  /** Classe tailwind de fundo temática (ex: 'bg-destructive/10') */
  bgColor: string;

  /** Trackers exibidos no card do personagem (na ordem) */
  trackers: TrackerDef[];

  /** Campos do select() do supabase além dos comuns (ex: 'session_blood_pool, session_gnosis') */
  participantSelectFields: string[];

  /** Inicialização lazy de trackers ao entrar na sala (1ª vez) */
  initializeTrackers: TrackerInitializer;

  /** Componente da ficha completa do personagem */
  CharacterSheet: ComponentType<{
    character: any;
    sessionTrackers?: Record<string, unknown>;
    experiencePoints?: number;
    readOnly?: boolean;
  }>;

  /** Componente de trackers (sidebar direita) — usado como fallback do card de jogador */
  PlayerTrackersComponent: ComponentType<{
    participantId: string;
    sessionId: string;
    sceneId: string | null;
    character: any;
    initialBloodPool?: number;
    initialWillpower?: number;
    initialHealthDamage?: boolean[];
    initialGnosis?: number;
    initialRage?: number;
    initialForm?: string;
  }>;

  /** Modal de pedir teste (narrador) */
  TestRequestModalComponent: ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    participants: any[];
    onRequestTest: (config: any) => void;
  }>;

  /** Componente de teste pendente (jogador) */
  PendingTestComponent: ComponentType<{
    sessionId: string;
    sceneId: string | null;
    characterId: string;
    characterName: string;
    vampiroData: any;
    testEvent: { id: string; event_data: any; created_at: string };
    onTestComplete: () => void;
    currentForm?: string;
    gameSystem?: string;
  }>;

  /** Painel lateral do jogador (resumo de sistema-específico: Disciplinas, Dons, etc.) */
  PlayerSidePanel: ComponentType<{
    character: any;
    experiencePoints?: number;
    sessionTrackers?: Record<string, unknown>;
    sheetLocked?: boolean;
    participants?: StorytellerParticipant[];
    currentUserId?: string;
  }>;

  /** Renderiza um evento do feed específico deste sistema (opcional — fallback genérico se ausente) */
  renderEventFeedItem?: (event: StorytellerEvent) => ReactNode;

  /** Indica se o sistema está disponível para uso (false para stubs Mago/Metamorfos) */
  available: boolean;
}
