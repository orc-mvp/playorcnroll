import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  manageHref?: string;
}

export default function UpgradeRequiredModal({ open, onOpenChange, manageHref = '/characters' }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            {t.upgrade?.modalTitle}
          </DialogTitle>
          <DialogDescription>{t.upgrade?.modalDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); navigate(manageHref); }}>
            {t.upgrade?.manageCharacters}
          </Button>
          <Button onClick={() => { onOpenChange(false); navigate('/upgrade'); }}>
            {t.upgrade?.upgradeAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
