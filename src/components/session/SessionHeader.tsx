import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Crown, LogOut, Sword } from 'lucide-react';
import type { SessionData } from '@/pages/Session';

interface SessionHeaderProps {
  session: SessionData;
  isNarrator: boolean;
  onEndSession: () => void;
}

export function SessionHeader({ session, isNarrator, onEndSession }: SessionHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-primary" />
            <h1 className="font-medieval text-lg md:text-xl text-foreground truncate max-w-[200px] md:max-w-none">
              {session.name}
            </h1>
          </div>

          {isNarrator && (
            <div className="hidden md:flex items-center gap-1 text-primary">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medieval">{t.roles.narrator}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Invite Code Display */}
          <div className="hidden md:block text-sm font-mono bg-muted px-2 py-1 rounded">
            {session.invite_code}
          </div>

          {/* End Session (Narrator only) */}
          {isNarrator && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <LogOut className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">{t.session.end}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-medieval">
                    Encerrar Sessão?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    Isso encerrará a sessão para todos os jogadores. 
                    Marcas temporárias expirarão e movimentos heroicos não usados serão perdidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={onEndSession}>
                    {t.session.end}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </header>
  );
}
