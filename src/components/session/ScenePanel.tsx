import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { Scene } from '@/pages/Session';

interface ScenePanelProps {
  currentScene: Scene | null;
  scenes: Scene[];
  isNarrator: boolean;
  onCreateScene: (name: string, description: string) => void;
}

export function ScenePanel({ currentScene, scenes, isNarrator, onCreateScene }: ScenePanelProps) {
  const { t, language } = useI18n();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDescription, setNewSceneDescription] = useState('');

  const dateLocale = language === 'pt-BR' ? ptBR : enUS;
  const pastScenes = scenes.filter(s => s.id !== currentScene?.id);

  const handleSubmit = () => {
    if (!newSceneName.trim()) return;
    onCreateScene(newSceneName.trim(), newSceneDescription.trim());
    setNewSceneName('');
    setNewSceneDescription('');
    setIsDialogOpen(false);
  };

  return (
    <Card className="medieval-card h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medieval flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t.scene.current}
          </CardTitle>

          {isNarrator && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  {t.scene.create}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-medieval">{t.scene.create}</DialogTitle>
                  <DialogDescription className="font-body">
                    {t.scene.createDialogDescription}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scene-name" className="font-medieval">
                      {t.scene.name}
                    </Label>
                    <Input
                      id="scene-name"
                      value={newSceneName}
                      onChange={(e) => setNewSceneName(e.target.value)}
                      placeholder={t.scene.namePlaceholder}
                      className="font-body"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scene-desc" className="font-medieval">
                      {t.scene.description}
                    </Label>
                    <Textarea
                      id="scene-desc"
                      value={newSceneDescription}
                      onChange={(e) => setNewSceneDescription(e.target.value)}
                      placeholder={t.scene.descriptionPlaceholder}
                      className="font-body min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button onClick={handleSubmit} disabled={!newSceneName.trim()}>
                    {t.common.create}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {currentScene ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-medieval text-xl text-primary mb-2">
                {currentScene.name}
              </h3>
              {currentScene.description && (
                <p className="font-body text-muted-foreground whitespace-pre-wrap">
                  {currentScene.description}
                </p>
              )}
              <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(currentScene.created_at), 'HH:mm', { locale: dateLocale })}
                </span>
              </div>
            </div>

            {/* Scene History */}
            {pastScenes.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="history" className="border-none">
                  <AccordionTrigger className="font-medieval text-sm py-2 hover:no-underline">
                    {t.scene.history} ({pastScenes.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {pastScenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <h4 className="font-medieval text-sm">{scene.name}</h4>
                          {scene.description && (
                            <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2">
                              {scene.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-body">
              {isNarrator 
                ? t.scene.emptyNarrator
                : t.scene.emptyPlayer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
