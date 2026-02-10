import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  Scroll,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Star,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react';

interface CustomMark {
  id: string;
  name: string;
  attribute: string;
  description: string;
  effect: string;
  session_id: string | null;
  created_by: string | null;
  created_at: string;
}

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

const attributeOptions = ['aggression', 'determination', 'seduction', 'cunning', 'faith'];

export default function CustomMarks() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [marks, setMarks] = useState<CustomMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMark, setEditingMark] = useState<CustomMark | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomMark | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAttribute, setFormAttribute] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEffect, setFormEffect] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch custom marks
  useEffect(() => {
    if (!user) return;

    const fetchMarks = async () => {
      const { data, error } = await supabase
        .from('minor_marks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching marks:', error);
      } else {
        setMarks(data || []);
      }
      setLoading(false);
    };

    fetchMarks();
  }, [user]);

  const resetForm = () => {
    setFormName('');
    setFormAttribute('');
    setFormDescription('');
    setFormEffect('');
    setEditingMark(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (mark: CustomMark) => {
    setFormName(mark.name);
    setFormAttribute(mark.attribute);
    setFormDescription(mark.description);
    setFormEffect(mark.effect);
    setEditingMark(mark);
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!formName.trim()) {
      toast({
        title: t.customMarks.nameRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!formAttribute) {
      toast({
        title: t.customMarks.attributeRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!formDescription.trim()) {
      toast({
        title: t.customMarks.descriptionRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!formEffect.trim()) {
      toast({
        title: t.customMarks.effectRequired,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingMark) {
        // Update existing mark
        const { error } = await supabase
          .from('minor_marks')
          .update({
            name: formName.trim(),
            attribute: formAttribute,
            description: formDescription.trim(),
            effect: formEffect.trim(),
          })
          .eq('id', editingMark.id);

        if (error) throw error;

        setMarks((prev) =>
          prev.map((m) =>
            m.id === editingMark.id
              ? {
                  ...m,
                  name: formName.trim(),
                  attribute: formAttribute,
                  description: formDescription.trim(),
                  effect: formEffect.trim(),
                }
              : m
          )
        );

        toast({
          title: t.customMarks.markUpdated,
        });
      } else {
        // Create new mark
        const { data, error } = await supabase
          .from('minor_marks')
          .insert({
            name: formName.trim(),
            attribute: formAttribute,
            description: formDescription.trim(),
            effect: formEffect.trim(),
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setMarks((prev) => [data, ...prev]);

        toast({
          title: t.customMarks.markCreated,
        });
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error saving mark:', error);
      toast({
        title: t.common.errorSaving,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('minor_marks')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setMarks((prev) => prev.filter((m) => m.id !== deleteTarget.id));

      toast({
        title: t.customMarks.markDeleted,
      });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error deleting mark:', error);
      toast({
        title: t.common.errorDeleting,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Scroll className="w-5 h-5 text-primary shrink-0" />
              <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
                {t.marks.createCustom}
              </h1>
            </div>
          </div>

          <Button onClick={openCreateModal} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">
              {t.customMarks.newMark}
            </span>
            <span className="sm:hidden">{t.customMarks.newMark}</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {marks.length === 0 ? (
          <Card className="medieval-card">
            <CardContent className="py-12 text-center">
              <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-medieval text-xl mb-2">
                {t.customMarks.noCustomMarks}
              </h3>
              <p className="text-muted-foreground font-body mb-6">
                {t.customMarks.createUniqueMarks}
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                {t.customMarks.createFirstMark}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {marks.map((mark) => {
              const Icon = attributeIcons[mark.attribute] || Star;

              return (
                <Card key={mark.id} className="medieval-card overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medieval text-lg">{mark.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {t.attributes[mark.attribute as keyof typeof t.attributes]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-body mb-2">
                          {mark.description}
                        </p>
                        <p className="text-sm text-primary font-body italic">
                          {mark.effect}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(mark)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(mark)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medieval">
              {editingMark ? t.customMarks.editMark : t.marks.createCustom}
            </DialogTitle>
            <DialogDescription className="font-body">
              {t.customMarks.defineDetails}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="mark-name" className="font-medieval">
                {t.customMarks.markName} *
              </Label>
              <Input
                id="mark-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.customMarks.markNamePlaceholder}
                className="font-body"
                maxLength={100}
              />
            </div>

            {/* Attribute */}
            <div className="space-y-2">
              <Label htmlFor="mark-attribute" className="font-medieval">
                {t.marks.attribute} *
              </Label>
              <Select value={formAttribute} onValueChange={setFormAttribute}>
                <SelectTrigger className="font-body">
                  <SelectValue
                    placeholder={t.customMarks.selectAttribute}
                  />
                </SelectTrigger>
                <SelectContent>
                  {attributeOptions.map((attr) => {
                    const Icon = attributeIcons[attr];
                    return (
                      <SelectItem key={attr} value={attr}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span>{t.attributes[attr as keyof typeof t.attributes]}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="mark-description" className="font-medieval">
                {t.marks.description} *
              </Label>
              <Textarea
                id="mark-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t.customMarks.descriptionPlaceholder}
                className="font-body min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>

            {/* Effect */}
            <div className="space-y-2">
              <Label htmlFor="mark-effect" className="font-medieval">
                {t.marks.effect} *
              </Label>
              <Textarea
                id="mark-effect"
                value={formEffect}
                onChange={(e) => setFormEffect(e.target.value)}
                placeholder={t.customMarks.effectPlaceholder}
                className="font-body min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t.common.loading}
                </>
              ) : editingMark ? (
                t.common.save
              ) : (
                t.common.create
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medieval">
              {t.customMarks.deleteMark}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {t.customMarks.deleteConfirm} <strong>{deleteTarget?.name}</strong>? {t.customMarks.cannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? t.common.loading : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
