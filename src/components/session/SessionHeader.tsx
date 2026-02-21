import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserMenu, type UserMenuExtraItem } from '@/components/UserMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, LogOut, Sword, Moon, Users, Link } from 'lucide-react';
import { EndSessionModal } from './EndSessionModal';
import { SessionInfoModal } from './SessionInfoModal';
import type { SessionData, Participant } from '@/pages/Session';

interface SessionHeaderProps {
  session: SessionData & { game_system?: string };
  isNarrator: boolean;
  participants: Participant[];
  onEndSession: () => void;
  onSessionUpdate?: (updates: { description: string | null }) => void;
  /** Called when narrator clicks the participants count (e.g. manage players) */
  onManagePlayers?: () => void;
  /** Called when a non-narrator player wants to leave */
  onLeaveSession?: () => void;
}

function getSystemConfig(gameSystem?: string) {
  if (gameSystem === 'vampiro_v3') {
    return {
      icon: <Moon className="w-6 h-6 text-destructive" />,
      badgeLabel: 'Vampiro: A Máscara',
      accentClass: 'border-destructive/20',
      gradientClass: 'from-destructive/10',
      badgeBorderClass: 'border-destructive/30 text-destructive',
      decorationClass: 'decoration-destructive/30',
    };
  }
  return {
    icon: <Sword className="w-6 h-6 text-primary" />,
    badgeLabel: 'Heróis Marcados',
    accentClass: 'border-primary/20',
    gradientClass: 'from-primary/10',
    badgeBorderClass: 'border-primary/30 text-primary',
    decorationClass: 'decoration-primary/30',
  };
}

export function SessionHeader({ session, isNarrator, participants, onEndSession, onSessionUpdate, onManagePlayers, onLeaveSession }: SessionHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const [showEndModal, setShowEndModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const cfg = getSystemConfig((session as any).game_system);

  const extraMenuItems: UserMenuExtraItem[] = [];
  if (isNarrator) {
    extraMenuItems.push({
      label: t.vampireSession.endSession,
      icon: <LogOut className="w-4 h-4" />,
      onClick: () => setShowEndModal(true),
      variant: 'destructive' as const,
    });
  } else if (onLeaveSession) {
    extraMenuItems.push({
      label: t.vampireSession.leave,
      icon: <LogOut className="w-4 h-4" />,
      onClick: onLeaveSession,
      variant: 'destructive' as const,
    });
  }

  const participantsContent = (
    <>
      <Users className="w-4 h-4" />
      <span>{participants.length} {t.vampireSession.players}</span>
    </>
  );

  return (
    <>
      <header className={`border-b ${cfg.accentClass} bg-gradient-to-r ${cfg.gradientClass} to-background px-4 py-3`}>
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
              {cfg.icon}
              <h1 className={`font-medieval text-xl text-foreground underline-offset-4 hover:underline ${cfg.decorationClass}`}>
                {session.name}
              </h1>
            </button>

            <Badge variant="outline" className={`${cfg.badgeBorderClass} hidden sm:inline-flex`}>
              {cfg.badgeLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Participants count */}
            {isNarrator && onManagePlayers ? (
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={onManagePlayers}
              >
                {participantsContent}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {participantsContent}
              </div>
            )}

            {/* Narrator actions */}
            {isNarrator && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`font-mono text-xs ${cfg.badgeBorderClass} hidden md:inline-flex`}>
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
