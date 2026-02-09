import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Scroll,
  Sword,
  Shield,
  Heart,
  Eye,
  Sparkles,
  Crown,
  Star,
  AlertTriangle,
} from 'lucide-react';

interface MinorMark {
  id: string;
  name: string;
  attribute: string;
  description: string;
  effect: string;
}

interface MajorMark {
  id: string;
  name: string;
  attribute: string;
  description?: string;
  effect?: string;
  isTemporary?: boolean;
}

interface MarksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minorMarkIds: string[];
  majorMarks: MajorMark[];
  epicMarks: MajorMark[];
  negativeMarks: MajorMark[];
}

const attributeIcons: Record<string, typeof Sword> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Eye,
  faith: Sparkles,
};

const attributeColors: Record<string, string> = {
  aggression: 'text-red-500 bg-red-500/10 border-red-500/30',
  determination: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  seduction: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
  cunning: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  faith: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
};

export function MarksModal({
  open,
  onOpenChange,
  minorMarkIds,
  majorMarks,
  epicMarks,
  negativeMarks,
}: MarksModalProps) {
  const { t } = useI18n();
  const [minorMarks, setMinorMarks] = useState<MinorMark[]>([]);
  const [filterAttribute, setFilterAttribute] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && minorMarkIds.length > 0) {
      fetchMinorMarks();
    }
  }, [open, minorMarkIds]);

  const fetchMinorMarks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('minor_marks')
      .select('*')
      .in('id', minorMarkIds);

    if (!error && data) {
      setMinorMarks(data);
    }
    setLoading(false);
  };

  const filteredMinorMarks = filterAttribute
    ? minorMarks.filter((m) => m.attribute === filterAttribute)
    : minorMarks;

  const filteredMajorMarks = filterAttribute
    ? majorMarks.filter((m) => m.attribute === filterAttribute)
    : majorMarks;

  const filteredEpicMarks = filterAttribute
    ? epicMarks.filter((m) => m.attribute === filterAttribute)
    : epicMarks;

  const filteredNegativeMarks = filterAttribute
    ? negativeMarks.filter((m) => m.attribute === filterAttribute)
    : negativeMarks;

  const renderMarkCard = (
    mark: MinorMark | MajorMark,
    type: 'minor' | 'major' | 'epic' | 'negative'
  ) => {
    const Icon = attributeIcons[mark.attribute] || Scroll;
    const colorClass = attributeColors[mark.attribute] || '';
    
    const typeIcon = {
      minor: Scroll,
      major: Crown,
      epic: Star,
      negative: AlertTriangle,
    }[type];
    
    const TypeIcon = typeIcon;
    
    const typeBorderClass = {
      minor: 'border-primary/30',
      major: 'border-amber-500/50',
      epic: 'border-yellow-400/50',
      negative: 'border-red-500/50',
    }[type];

    return (
      <div
        key={mark.id}
        className={cn(
          'p-3 rounded-lg border-2 bg-card/50',
          typeBorderClass
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              colorClass
            )}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon className={cn(
                'w-3 h-3',
                type === 'minor' && 'text-primary',
                type === 'major' && 'text-amber-500',
                type === 'epic' && 'text-yellow-400',
                type === 'negative' && 'text-red-500'
              )} />
              <h4 className="font-medieval text-sm truncate">{mark.name}</h4>
              {'isTemporary' in mark && mark.isTemporary && (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                  Temp
                </Badge>
              )}
            </div>
            {'description' in mark && mark.description && (
              <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                {mark.description}
              </p>
            )}
            {'effect' in mark && mark.effect && (
              <p className="text-xs text-primary">
                <strong>{t.marks.effect}:</strong> {mark.effect}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Scroll className="w-5 h-5 text-primary" />
            {t.character.minorMarks}
          </DialogTitle>
        </DialogHeader>

        {/* Attribute Filter */}
        <div className="flex gap-1 flex-wrap pb-2 border-b border-border shrink-0">
          <Button
            variant={filterAttribute === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAttribute(null)}
            className="h-8 px-3"
          >
            {t.common.all}
          </Button>
          {Object.keys(attributeIcons).map((attr) => {
            const Icon = attributeIcons[attr];
            return (
              <Button
                key={attr}
                variant={filterAttribute === attr ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setFilterAttribute(filterAttribute === attr ? null : attr)
                }
                className="h-8 w-8 p-0"
                title={t.attributes[attr as keyof typeof t.attributes]}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>

        <Tabs defaultValue="minor" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid grid-cols-4 shrink-0">
            <TabsTrigger value="minor" className="text-xs gap-1">
              <Scroll className="w-3 h-3" />
              <span className="hidden sm:inline">{t.marks.minor}</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filteredMinorMarks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="major" className="text-xs gap-1">
              <Crown className="w-3 h-3" />
              <span className="hidden sm:inline">{t.marks.major}</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filteredMajorMarks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="epic" className="text-xs gap-1">
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">{t.marks.epic}</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filteredEpicMarks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="negative" className="text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden sm:inline">{t.marks.negative}</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filteredNegativeMarks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-3">
            <TabsContent value="minor" className="mt-0 space-y-2">
              {loading ? (
                <p className="text-center text-muted-foreground py-4">
                  {t.common.loading}
                </p>
              ) : filteredMinorMarks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t.characterSheet.noMarksEmpty.minor}
                </p>
              ) : (
                filteredMinorMarks.map((mark) => renderMarkCard(mark, 'minor'))
              )}
            </TabsContent>

            <TabsContent value="major" className="mt-0 space-y-2">
              {filteredMajorMarks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t.characterSheet.noMarksEmpty.major}
                </p>
              ) : (
                filteredMajorMarks.map((mark) => renderMarkCard(mark, 'major'))
              )}
            </TabsContent>

            <TabsContent value="epic" className="mt-0 space-y-2">
              {filteredEpicMarks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t.characterSheet.noMarksEmpty.epic}
                </p>
              ) : (
                filteredEpicMarks.map((mark) => renderMarkCard(mark, 'epic'))
              )}
            </TabsContent>

            <TabsContent value="negative" className="mt-0 space-y-2">
              {filteredNegativeMarks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t.characterSheet.noMarksEmpty.negative}
                </p>
              ) : (
                filteredNegativeMarks.map((mark) =>
                  renderMarkCard(mark, 'negative')
                )
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
