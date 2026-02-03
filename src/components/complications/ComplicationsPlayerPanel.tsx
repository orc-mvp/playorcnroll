import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Users,
  Footprints,
  Handshake,
  Coins,
  Skull,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Complication {
  id: string;
  type: string;
  description: string;
  is_visible: boolean;
  is_manifested: boolean;
  manifest_note: string | null;
  created_at: string;
}

interface ComplicationsPlayerPanelProps {
  sessionId: string;
  characterId: string;
}

const typeIcons: Record<string, React.ElementType> = {
  reputational: Users,
  tracking: Footprints,
  betrayal: Handshake,
  debt: Coins,
  minor_curse: Skull,
};

export function ComplicationsPlayerPanel({ sessionId, characterId }: ComplicationsPlayerPanelProps) {
  const { t } = useI18n();
  const [complications, setComplications] = useState<Complication[]>([]);

  useEffect(() => {
    const fetchComplications = async () => {
      // Player can only see visible complications or manifested ones
      const { data } = await supabase
        .from('complications')
        .select('*')
        .eq('session_id', sessionId)
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });
      
      // Filter client-side for visible or manifested
      const visible = (data || []).filter(c => c.is_visible || c.is_manifested);
      setComplications(visible);
    };

    fetchComplications();

    // Subscribe to changes
    const channel = supabase
      .channel(`player-complications-${characterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complications', filter: `character_id=eq.${characterId}` },
        () => fetchComplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, characterId]);

  const activeComplications = complications.filter(c => !c.is_manifested);
  const manifestedComplications = complications.filter(c => c.is_manifested);
  const count = activeComplications.length;
  const isAtLimit = count >= 3;

  if (complications.length === 0) {
    return null;
  }

  return (
    <Card className={cn(
      "medieval-card",
      isAtLimit && "border-red-500/50"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="font-medieval text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "w-4 h-4",
              isAtLimit ? "text-red-500" : "text-yellow-500"
            )} />
            {t.complications.title}
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              isAtLimit 
                ? "bg-red-500/20 text-red-500 border-red-500/50"
                : count > 0 
                  ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                  : ""
            )}
          >
            {count}/3
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Warning at limit */}
        {isAtLimit && (
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/20 text-red-500 text-xs">
            <Skull className="w-4 h-4 flex-shrink-0" />
            <span className="font-body">
              {t.complications.manifestBefore}
            </span>
          </div>
        )}

        {/* Active Complications */}
        {activeComplications.length > 0 && (
          <div className="space-y-2">
            {activeComplications.map(comp => {
              const TypeIcon = typeIcons[comp.type] || AlertTriangle;
              return (
                <div 
                  key={comp.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <TypeIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body">
                      {comp.description}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {t.complications[comp.type as keyof typeof t.complications] || comp.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Manifested (resolved) Complications */}
        {manifestedComplications.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medieval">Resolvidas:</p>
            {manifestedComplications.slice(0, 3).map(comp => {
              const TypeIcon = typeIcons[comp.type] || AlertTriangle;
              return (
                <div 
                  key={comp.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border opacity-60"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body line-through">
                      {comp.description}
                    </p>
                    {comp.manifest_note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{comp.manifest_note}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
