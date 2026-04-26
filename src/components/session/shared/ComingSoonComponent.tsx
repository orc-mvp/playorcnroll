/**
 * Placeholder para sistemas WoD ainda não implementados (Mago, Metamorfos).
 * Renderiza um cartão informativo "Em breve" para qualquer slot do adapter.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Hourglass } from 'lucide-react';

export function ComingSoonComponent() {
  return (
    <Card className="medieval-card border-muted">
      <CardContent className="flex flex-col items-center text-center py-8 gap-3">
        <Hourglass className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-body">
          Este sistema ainda não está disponível.
        </p>
        <p className="text-xs text-muted-foreground/70 font-body">
          Em breve você poderá jogar com este sistema na sala unificada.
        </p>
      </CardContent>
    </Card>
  );
}

export default ComingSoonComponent;
