/**
 * StorytellerEventFeed — feed unificado para a sala Storyteller.
 *
 * Na Fase 1, delega para o feed específico do sistema da sessão (Vampiro ou
 * Lobisomem), preservando integralmente os comportamentos atuais.
 *
 * Na Fase 2/3 (planejada), os dois feeds serão fundidos num único, com os
 * ícones específicos delegados aos adapters via `renderEventFeedItem`.
 */

import { VampireEventFeed } from '@/components/session/vampire/VampireEventFeed';
import { WerewolfEventFeed } from '@/components/session/werewolf/WerewolfEventFeed';
import type { StorytellerEvent } from '@/lib/storyteller/types';

interface Props {
  events: StorytellerEvent[];
  gameSystem: string;
  currentUserId?: string;
  isNarrator?: boolean;
}

export function StorytellerEventFeed({ events, gameSystem, currentUserId, isNarrator }: Props) {
  if (gameSystem === 'lobisomem_w20') {
    return (
      <WerewolfEventFeed
        events={events as any}
        currentUserId={currentUserId}
        isNarrator={isNarrator}
      />
    );
  }
  return (
    <VampireEventFeed
      events={events as any}
      currentUserId={currentUserId}
      isNarrator={isNarrator}
    />
  );
}
