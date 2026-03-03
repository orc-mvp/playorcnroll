import { useTranslation } from '@/lib/i18n';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { VampirePendingTest } from './VampirePendingTest';
import { Dices } from 'lucide-react';
import type { VampiroCharacterData, TestType } from '@/lib/vampiro/diceUtils';

interface TestConfig {
  testType: TestType;
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

export interface MobilePendingTestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sceneId: string | null;
  characterId: string;
  characterName: string;
  vampiroData: VampiroCharacterData;
  testEvent: {
    id: string;
    event_data: TestConfig;
    created_at: string;
  };
  currentForm?: string;
  gameSystem?: string;
}

export function MobilePendingTestDrawer({
  open,
  onOpenChange,
  sessionId,
  sceneId,
  characterId,
  characterName,
  vampiroData,
  testEvent,
  currentForm,
  gameSystem,
}: MobilePendingTestDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={false}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-destructive" />
            {t.mobile.pendingTestTitle}
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          <VampirePendingTest
            sessionId={sessionId}
            sceneId={sceneId}
            characterId={characterId}
            characterName={characterName}
            vampiroData={vampiroData}
            testEvent={testEvent}
            onTestComplete={() => onOpenChange(false)}
            currentForm={currentForm}
            gameSystem={gameSystem}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
