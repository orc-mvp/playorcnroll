import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Scroll, 
  Search,
  Check,
  Sword,
  Shield,
  Heart,
  Eye,
  Sparkles
} from 'lucide-react';
import type { CharacterFormData } from '@/pages/CreateCharacter';

interface StepMinorMarksProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

interface MinorMark {
  id: string;
  name: string;
  attribute: string;
  description: string;
  effect: string;
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

export default function StepMinorMarks({ formData, updateFormData }: StepMinorMarksProps) {
  const { t } = useI18n();
  const [marks, setMarks] = useState<MinorMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAttribute, setFilterAttribute] = useState<string | null>(null);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    const { data, error } = await supabase
      .from('minor_marks')
      .select('*')
      .order('attribute')
      .order('name');

    if (error) {
      console.error('Error fetching marks:', error);
    } else {
      setMarks(data || []);
    }
    setLoading(false);
  };

  const toggleMark = (markId: string) => {
    const currentMarks = formData.selectedMarks;
    
    if (currentMarks.includes(markId)) {
      updateFormData({
        selectedMarks: currentMarks.filter(id => id !== markId),
      });
    } else if (currentMarks.length < 2) {
      updateFormData({
        selectedMarks: [...currentMarks, markId],
      });
    }
  };

  const filteredMarks = marks.filter(mark => {
    const matchesSearch = 
      mark.name.toLowerCase().includes(search.toLowerCase()) ||
      mark.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filterAttribute || mark.attribute === filterAttribute;
    return matchesSearch && matchesFilter;
  });

  const selectedMarkDetails = marks.filter(m => formData.selectedMarks.includes(m.id));

  return (
    <Card className="medieval-card max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Scroll className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-medieval text-2xl">
          {t.character.minorMarks}
        </CardTitle>
        <CardDescription className="font-body">
          {t.character.selectMinorMarks}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selection Counter */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={cn(
              "px-4 py-2 text-lg",
              formData.selectedMarks.length === 2 
                ? "bg-primary/20 border-primary text-primary" 
                : "bg-muted"
            )}
          >
            {formData.selectedMarks.length}/2 {t.marks.minor}s
          </Badge>
        </div>

        {/* Selected Marks Preview */}
        {selectedMarkDetails.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedMarkDetails.map(mark => {
              const Icon = attributeIcons[mark.attribute] || Scroll;
              return (
                <div 
                  key={mark.id}
                  className="p-3 rounded-lg border-2 border-primary bg-primary/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medieval text-primary">{mark.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0"
                      onClick={() => toggleMark(mark.id)}
                    >
                      ×
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{mark.effect}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.search}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterAttribute === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAttribute(null)}
            >
              {t.common.all}
            </Button>
            {Object.keys(attributeIcons).map(attr => {
              const Icon = attributeIcons[attr];
              return (
                <Button
                  key={attr}
                  variant={filterAttribute === attr ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterAttribute(filterAttribute === attr ? null : attr)}
                  className="gap-1"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t.attributes[attr as keyof typeof t.attributes]}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Marks List */}
        <ScrollArea className="h-[400px] rounded-lg border border-border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">{t.common.loading}</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredMarks.map(mark => {
                const Icon = attributeIcons[mark.attribute] || Scroll;
                const isSelected = formData.selectedMarks.includes(mark.id);
                const canSelect = formData.selectedMarks.length < 2 || isSelected;

                return (
                  <button
                    key={mark.id}
                    type="button"
                    onClick={() => canSelect && toggleMark(mark.id)}
                    disabled={!canSelect}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all",
                      "hover:scale-[1.01] active:scale-[0.99]",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : attributeColors[mark.attribute],
                      !canSelect && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        attributeColors[mark.attribute]
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medieval text-foreground">
                            {mark.name}
                          </h4>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 font-body">
                          {mark.description}
                        </p>
                        <p className="text-xs text-primary font-body">
                          <strong>{t.marks.effect}:</strong> {mark.effect}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredMarks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma marca encontrada
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
