import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';

interface CharacterOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterOptionsModal({ open, onOpenChange }: CharacterOptionsModalProps) {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval text-xl text-center">
            {t.nav.characters}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Create Character */}
          <Card 
            className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => handleNavigate('/character/create')}
          >
            <CardHeader className="p-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-medieval text-base">{t.character.create}</CardTitle>
              <CardDescription className="font-body text-xs">
                {t.characterOptions.createNew}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* View Characters */}
          <Card 
            className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => handleNavigate('/characters')}
          >
            <CardHeader className="p-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-medieval text-base">{t.nav.characters}</CardTitle>
              <CardDescription className="font-body text-xs">
                {t.characterOptions.viewCreated}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
