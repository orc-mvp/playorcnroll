import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Star,
  Scroll,
  Trash2,
  Pencil,
  Loader2,
  Shield,
  Zap,
} from 'lucide-react';
import { GAME_SYSTEMS } from '@/lib/gameSystems';

interface MeritFlaw {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  prerequisites: string | null;
  sourcebook: string | null;
  game_systems: string[];
  created_by: string;
  created_at: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  physical: Zap,
  social: Star,
  mental: Shield,
  supernatural: Star,
};

export default function MeritsFlaws() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const [items, setItems] = useState<MeritFlaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MeritFlaw | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeritFlaw | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filterSystem, setFilterSystem] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCost, setFormCost] = useState(0);
  const [formCategory, setFormCategory] = useState('physical');
  const [formPrerequisites, setFormPrerequisites] = useState('');
  const [formSourcebook, setFormSourcebook] = useState('');
  const [formGameSystems, setFormGameSystems] = useState<string[]>(['vampiro_v3']);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('merits_flaws')
        .select('*')
        .order('category')
        .order('cost', { ascending: false })
        .order('name');

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching merits/flaws:', error);
      } else {
        setItems((data as MeritFlaw[]) || []);
      }
      setLoading(false);
    };

    fetchItems();
  }, [user]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormCost(0);
    setFormCategory('physical');
    setFormPrerequisites('');
    setFormSourcebook('');
    setFormGameSystems(['vampiro_v3']);
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: MeritFlaw) => {
    setFormName(item.name);
    setFormDescription(item.description);
    setFormCost(item.cost);
    setFormCategory(item.category);
    setFormPrerequisites(item.prerequisites || '');
    setFormSourcebook(item.sourcebook || '');
    setFormGameSystems(item.game_systems || ['vampiro_v3']);
    setEditingItem(item);
    setShowModal(true);
  };

  const toggleGameSystem = (systemId: string) => {
    setFormGameSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((s) => s !== systemId)
        : [...prev, systemId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!formName.trim()) {
      toast({ title: t.meritsFlaws.nameRequired, variant: 'destructive' });
      return;
    }
    if (!formDescription.trim()) {
      toast({ title: t.meritsFlaws.descriptionRequired, variant: 'destructive' });
      return;
    }
    if (formGameSystems.length === 0) {
      toast({ title: t.meritsFlaws.categoryRequired, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        cost: formCost,
        category: formCategory,
        prerequisites: formPrerequisites.trim() || null,
        sourcebook: formSourcebook.trim() || null,
        game_systems: formGameSystems,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('merits_flaws')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;

        setItems((prev) =>
          prev.map((m) => (m.id === editingItem.id ? { ...m, ...payload } : m))
        );
        toast({ title: t.meritsFlaws.itemUpdated });
      } else {
        const { data, error } = await supabase
          .from('merits_flaws')
          .insert({ ...payload, created_by: user.id })
          .select()
          .single();
        if (error) throw error;

        setItems((prev) => [...prev, data as MeritFlaw]);
        toast({ title: t.meritsFlaws.itemCreated });
      }

      setShowModal(false);
      resetForm();
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error saving:', error);
      toast({ title: t.common.errorSaving, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('merits_flaws')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;

      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast({ title: t.meritsFlaws.itemDeleted });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error deleting:', error);
      toast({ title: t.common.errorDeleting, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterSystem !== 'all' && !item.game_systems?.includes(filterSystem)) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  const categoryLabel = (cat: string) =>
    t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string || cat;

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
              <Star className="w-5 h-5 text-primary shrink-0" />
              <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
                {t.marks.createCustom}
              </h1>
            </div>
          </div>

          <Button onClick={openCreateModal} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            <span>{t.meritsFlaws.newMeritFlaw}</span>
          </Button>
        </div>
      </header>

      {/* Sub-navigation */}
      <div className="container mx-auto px-4 py-3 flex gap-2 border-b border-border bg-card/50 backdrop-blur-sm sticky top-[65px] z-40">
        <Button
          variant="outline"
          size="sm"
          className="font-medieval"
          onClick={() => navigate('/marks')}
        >
          <Scroll className="w-4 h-4 mr-1" />
          {t.marks.tabMarks}
        </Button>
        <Button variant="default" size="sm" className="font-medieval">
          <Star className="w-4 h-4 mr-1" />
          {t.meritsFlaws.title}
        </Button>
      </div>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Filters */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={filterSystem} onValueChange={setFilterSystem}>
              <SelectTrigger className="w-[200px] font-body">
                <SelectValue placeholder={t.meritsFlaws.filterBySystem} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.meritsFlaws.allSystems}</SelectItem>
                {GAME_SYSTEMS.filter((s) => s.available).map((sys) => (
                  <SelectItem key={sys.id} value={sys.id}>
                    {sys.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px] font-body">
                <SelectValue placeholder={t.meritsFlaws.filterByCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.meritsFlaws.allCategories}</SelectItem>
                <SelectItem value="physical">{t.meritsFlaws.physical}</SelectItem>
                <SelectItem value="social">{t.meritsFlaws.social}</SelectItem>
                <SelectItem value="mental">{t.meritsFlaws.mental}</SelectItem>
                <SelectItem value="supernatural">{t.meritsFlaws.supernatural}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {filteredItems.length === 0 && items.length === 0 ? (
          <Card className="medieval-card">
            <CardContent className="py-12 text-center">
              <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-medieval text-xl mb-2">
                {t.meritsFlaws.noItems}
              </h3>
              <p className="text-muted-foreground font-body mb-6">
                {t.meritsFlaws.createFirst}
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                {t.meritsFlaws.createFirstButton}
              </Button>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-body">
            {t.common.none}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map((item) => {
              const Icon = categoryIcons[item.category] || Star;
              const isMerit = item.cost > 0;

              return (
                <Card key={item.id} className="medieval-card overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isMerit ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isMerit ? 'text-green-500' : 'text-red-500'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medieval text-base">{item.name}</h3>
                          <Badge
                            variant="outline"
                            className={
                              isMerit
                                ? 'border-green-500/50 text-green-500'
                                : 'border-red-500/50 text-red-500'
                            }
                          >
                            {isMerit ? '+' : ''}{item.cost} {t.meritsFlaws.points}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabel(item.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-body mb-1 line-clamp-2">
                          {item.description}
                        </p>
                        {item.prerequisites && (
                          <p className="text-xs text-muted-foreground/70 font-body italic">
                            {t.meritsFlaws.prerequisites}: {item.prerequisites}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.game_systems?.map((sys) => {
                            const system = GAME_SYSTEMS.find((s) => s.id === sys);
                            return (
                              <Badge key={sys} variant="outline" className="text-xs">
                                {system?.shortName || sys}
                              </Badge>
                            );
                          })}
                          {item.sourcebook && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {item.sourcebook}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {item.created_by === user?.id && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-medieval">
              {editingItem ? t.meritsFlaws.editItem : t.meritsFlaws.createItem}
            </DialogTitle>
            <DialogDescription className="font-body">
              {t.meritsFlaws.defineDetails}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.name} *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.meritsFlaws.namePlaceholder}
                className="font-body"
                maxLength={100}
              />
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.cost}</Label>
              <Input
                type="number"
                value={formCost}
                onChange={(e) => setFormCost(parseInt(e.target.value) || 0)}
                className="font-body"
                min={-7}
                max={7}
              />
              <p className="text-xs text-muted-foreground">{t.meritsFlaws.costHint}</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.category}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">{t.meritsFlaws.physical}</SelectItem>
                  <SelectItem value="social">{t.meritsFlaws.social}</SelectItem>
                  <SelectItem value="mental">{t.meritsFlaws.mental}</SelectItem>
                  <SelectItem value="supernatural">{t.meritsFlaws.supernatural}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.description} *</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t.meritsFlaws.descriptionPlaceholder}
                className="font-body min-h-[80px] resize-none"
                maxLength={1000}
              />
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.prerequisites}</Label>
              <Input
                value={formPrerequisites}
                onChange={(e) => setFormPrerequisites(e.target.value)}
                placeholder={t.meritsFlaws.prerequisitesPlaceholder}
                className="font-body"
                maxLength={200}
              />
            </div>

            {/* Sourcebook */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.sourcebook}</Label>
              <Input
                value={formSourcebook}
                onChange={(e) => setFormSourcebook(e.target.value)}
                placeholder={t.meritsFlaws.sourcebookPlaceholder}
                className="font-body"
                maxLength={200}
              />
            </div>

            {/* Game Systems */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.gameSystems} *</Label>
              <div className="space-y-2">
                {GAME_SYSTEMS.filter((s) => s.available).map((sys) => (
                  <div key={sys.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`system-${sys.id}`}
                      checked={formGameSystems.includes(sys.id)}
                      onCheckedChange={() => toggleGameSystem(sys.id)}
                    />
                    <Label htmlFor={`system-${sys.id}`} className="font-body cursor-pointer">
                      {sys.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t.common.loading}
                </>
              ) : editingItem ? (
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
              {t.meritsFlaws.deleteItem}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {t.meritsFlaws.deleteConfirm} <strong>{deleteTarget?.name}</strong>?{' '}
              {t.meritsFlaws.cannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
