import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const DISMISS_KEY = 'upgradeBannerDismissed';

export default function UpgradeBanner() {
  const { user } = useAuth();
  const { isPremium, loading } = usePremium();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Resets on each fresh page load (sessionStorage tied to tab; we use in-memory state so refresh reopens)
    setDismissed(false);
  }, []);

  if (!user || loading || isPremium || dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-amber-50 shadow-md border-b border-amber-900/40">
      <div className="container mx-auto px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0" />
          <p className="text-xs sm:text-sm truncate">{t.upgrade?.bannerMessage}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100"
            onClick={() => navigate('/upgrade')}
          >
            {t.upgrade?.upgradeAction}
          </Button>
          <button
            aria-label="Fechar"
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-amber-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
