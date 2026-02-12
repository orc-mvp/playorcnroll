import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Users } from 'lucide-react';

interface SessionOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionOptionsModal({ open, onOpenChange }: SessionOptionsModalProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-medieval text-xl text-center">
            {t.nav.sessions}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {/* Create Session */}
          <Card 
            className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => handleNavigate('/session/create')}
          >
            <CardHeader className="p-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-medieval text-base">{t.session.create}</CardTitle>
              <CardDescription className="font-body text-xs">
                {t.dashboard.createSessionDesc}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* My Sessions */}
          <Card 
            className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => handleNavigate('/sessions')}
          >
            <CardHeader className="p-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-medieval text-base">{t.session.mySessions}</CardTitle>
              <CardDescription className="font-body text-xs">
                {t.dashboard.mySessionsDesc}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Join Session */}
          <Card 
            className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => handleNavigate('/join')}
          >
            <CardHeader className="p-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-medieval text-base">{t.session.join}</CardTitle>
              <CardDescription className="font-body text-xs">
                {t.dashboard.joinSessionDesc}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
