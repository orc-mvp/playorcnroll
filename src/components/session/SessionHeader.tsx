import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';
import { ArrowLeft, Crown, LogOut, Sword } from 'lucide-react';
import { EndSessionModal } from './EndSessionModal';
import { SessionInfoModal } from './SessionInfoModal';
import type { SessionData, Participant } from '@/pages/Session';

interface SessionHeaderProps {
  session: SessionData;
  isNarrator: boolean;
  participants: Participant[];
  onEndSession: () => void;
  onSessionUpdate?: (updates: { description: string | null }) => void;
}

export function SessionHeader({ session, isNarrator, participants, onEndSession, onSessionUpdate }: SessionHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showEndModal, setShowEndModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <button
              className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
              onClick={() => setShowInfoModal(true)}
            >
              <Sword className="w-5 h-5 text-primary shrink-0" />
              <h1 className="font-medieval text-base sm:text-lg md:text-xl text-foreground truncate underline-offset-4 hover:underline decoration-primary/30">
                {session.name}
              </h1>
            </button>

            {isNarrator && (
              <div className="hidden md:flex items-center gap-1 text-primary shrink-0">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medieval">{t.roles.narrator}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block text-sm font-mono bg-muted px-2 py-1 rounded">
              {session.invite_code}
            </div>

            {isNarrator && (
              <Button variant="destructive" size="sm" onClick={() => setShowEndModal(true)}>
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">{t.session.end}</span>
              </Button>
            )}

            <UserMenu />
          </div>
        </div>
      </header>

      <EndSessionModal
        open={showEndModal}
        onOpenChange={setShowEndModal}
        session={session}
        participants={participants}
        onEndSession={onEndSession}
      />

      <SessionInfoModal
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
        session={session}
        isNarrator={isNarrator}
        onSessionUpdate={onSessionUpdate}
      />
    </>
  );
}
