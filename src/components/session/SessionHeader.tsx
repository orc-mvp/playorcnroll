import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/UserMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, LogOut, Sword, Users, Link } from 'lucide-react';
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
  const { toast } = useToast();
  const [showEndModal, setShowEndModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const extraMenuItems = isNarrator
    ? [
        {
          label: t.vampireSession.endSession,
          icon: <LogOut className="w-4 h-4" />,
          onClick: () => setShowEndModal(true),
          variant: 'destructive' as const,
        },
      ]
    : [];

  return (
    <>
      <header className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <button
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => setShowInfoModal(true)}
            >
              <Sword className="w-6 h-6 text-primary" />
              <h1 className="font-medieval text-xl text-foreground underline-offset-4 hover:underline decoration-primary/30">
                {session.name}
              </h1>
            </button>

            <Badge variant="outline" className="border-primary/30 text-primary hidden sm:inline-flex">
              Heróis Marcados
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Participants count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{participants.length} {t.vampireSession.players}</span>
            </div>

            {/* Narrator actions */}
            {isNarrator && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs border-primary/30 hidden md:inline-flex">
                  {session.invite_code}
                </Badge>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const url = `${window.location.origin}/join/${session.invite_code}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: t.vampireSession.linkCopied });
                        }}
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.vampireSession.copyInviteLink}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            <UserMenu extraItems={extraMenuItems} />
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
