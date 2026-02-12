import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { User, KeyRound, LogOut } from 'lucide-react';

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu() {
  const { profile, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-9 w-9 cursor-pointer border-2 border-primary/30 hover:border-primary transition-colors">
            <AvatarFallback className="bg-primary/10 text-primary font-medieval text-sm">
              {getInitials(profile?.display_name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="px-3 py-2 border-b border-border mb-1">
          <p className="font-medieval text-sm text-foreground truncate">
            {profile?.display_name || '?'}
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 font-body"
          onClick={() => navigate('/profile')}
        >
          <User className="w-4 h-4" />
          {t.profile.title}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 font-body"
          onClick={() => navigate('/profile')}
        >
          <KeyRound className="w-4 h-4" />
          {t.profile.changePassword}
        </Button>
        <div className="border-t border-border mt-1 pt-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 font-body text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            {t.auth.logout}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
