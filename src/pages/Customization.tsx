import { useEffect, useState, useMemo } from 'react';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
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
  Search,
  Sword,
  Heart,
  Brain,
  Flame,
} from 'lucide-react';
import { GAME_SYSTEMS } from '@/lib/gameSystems';
import { toTitleCase } from '@/lib/textUtils';

// ---- Types ----

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

// ---- Constants ----

const ITEMS_PER_PAGE = 50;

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

const categoryIcons: Record<string, React.ElementType> = {
  physical: Zap,
  social: Star,
  other: Star,
  mental: Shield,
  supernatural: Star,
};

const attributeOptions = ['aggression', 'determination', 'seduction', 'cunning', 'faith'];

type ActiveTab = 'marks' | 'merits_flaws';

/**
 * Sistemas exibidos no formulário/filtros de Vantagens & Desvantagens.
 * Metamorfos compartilham M&F com Lobisomem (mesmo `lobisomem_w20` no banco),
 * portanto escondemos `metamorfos_w20` aqui e renomeamos `lobisomem_w20` como
 * "Lobisomem / Metamorfo" para deixar claro que serve aos dois.
 */
const getMfSystems = () =>
  GAME_SYSTEMS.filter((s) => s.available && s.id !== 'metamorfos_w20');
const getMfSystemLabel = (sysId: string, lobMetLabel: string) => {
  if (sysId === 'lobisomem_w20') return lobMetLabel;
  return GAME_SYSTEMS.find((s) => s.id === sysId)?.name || sysId;
};

export default function Customization() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();

  // activeTab is now derived from filterSystem (no longer state)

  // ---- Marks state ----
  const [marks, setMarks] = useState<CustomMark[]>([]);
  const [marksLoading, setMarksLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [editingMark, setEditingMark] = useState<CustomMark | null>(null);
  const [deleteMarkTarget, setDeleteMarkTarget] = useState<CustomMark | null>(null);

  // Mark form
  const [markFormName, setMarkFormName] = useState('');
  const [markFormAttribute, setMarkFormAttribute] = useState('');
  const [markFormDescription, setMarkFormDescription] = useState('');
  const [markFormEffect, setMarkFormEffect] = useState('');

  // ---- Merits/Flaws state ----
  const [items, setItems] = useState<MeritFlaw[]>([]);
  const [mfLoading, setMfLoading] = useState(true);
  const [showMfModal, setShowMfModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MeritFlaw | null>(null);
  const [deleteMfTarget, setDeleteMfTarget] = useState<MeritFlaw | null>(null);

  // MF form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCost, setFormCost] = useState(0);
  const [formCategory, setFormCategory] = useState('physical');
  const [formPrerequisites, setFormPrerequisites] = useState('');
  const [formSourcebook, setFormSourcebook] = useState('');
  const [formGameSystems, setFormGameSystems] = useState<string[]>([]);

  // ---- Shared state ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSystem, setFilterSystem] = useState<string>('all');

  // Auto-switch content type based on system
  const activeTab: ActiveTab = filterSystem === 'herois_marcados' ? 'marks' : 'merits_flaws';
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAttribute, setFilterAttribute] = useState<string>('all');
  const [filterSourcebook, setFilterSourcebook] = useState<string>('all');
  const [filterCost, setFilterCost] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Auth redirect ----
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ---- Fetch data ----
  useEffect(() => {
    if (!user) return;

    const fetchMarks = async () => {
      const { data, error } = await supabase
        .from('minor_marks')
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (!error) setMarks(data || []);
      setMarksLoading(false);
    };

    const fetchMeritsFlaws = async () => {
      const { data, error } = await supabase
        .from('merits_flaws')
        .select('*')
        .order('name');

      if (!error) setItems((data as MeritFlaw[]) || []);
      setMfLoading(false);
    };

    fetchMarks();
    fetchMeritsFlaws();
  }, [user]);

  // Reset page on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterSystem, filterCategory, filterType, filterAttribute, filterSourcebook, filterCost]);

  // ---- Filtered + paginated data ----
  const filteredMarks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return marks.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q) && !m.effect.toLowerCase().includes(q)) return false;
      if (filterAttribute !== 'all' && m.attribute !== filterAttribute) return false;
      return true;
    });
  }, [marks, searchQuery, filterAttribute]);

  const filteredMeritsFlaws = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesBook = item.sourcebook?.toLowerCase().includes(q);
        const matchesPrereq = item.prerequisites?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesBook && !matchesPrereq) return false;
      }
      if (filterSystem !== 'all' && !item.game_systems?.includes(filterSystem)) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterType === 'merit' && item.cost <= 0) return false;
      if (filterType === 'flaw' && item.cost >= 0) return false;
      if (filterSourcebook !== 'all' && (item.sourcebook || '') !== filterSourcebook) return false;
      if (filterCost !== 'all') {
        const costNum = Math.abs(item.cost);
        if (filterCost === '1' && costNum !== 1) return false;
        if (filterCost === '2' && costNum !== 2) return false;
        if (filterCost === '3' && costNum !== 3) return false;
        if (filterCost === '4' && costNum !== 4) return false;
        if (filterCost === '5' && costNum !== 5) return false;
        if (filterCost === '6+' && costNum < 6) return false;
      }
      return true;
    });
  }, [items, searchQuery, filterSystem, filterCategory, filterType, filterSourcebook, filterCost]);

  const availableSourcebooks = useMemo(() => {
    const books = new Set<string>();
    items.forEach((item) => { if (item.sourcebook) books.add(item.sourcebook); });
    return Array.from(books).sort();
  }, [items]);

  const currentItems = activeTab === 'marks' ? filteredMarks : filteredMeritsFlaws;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE));
  const paginatedItems = currentItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ---- Mark CRUD ----
  const resetMarkForm = () => {
    setMarkFormName('');
    setMarkFormAttribute('');
    setMarkFormDescription('');
    setMarkFormEffect('');
    setEditingMark(null);
  };

  const openCreateMark = () => {
    resetMarkForm();
    setShowMarkModal(true);
  };

  const openEditMark = (mark: CustomMark) => {
    setMarkFormName(mark.name);
    setMarkFormAttribute(mark.attribute);
    setMarkFormDescription(mark.description);
    setMarkFormEffect(mark.effect);
    setEditingMark(mark);
    setShowMarkModal(true);
  };

  const handleMarkSubmit = async () => {
    if (!user) return;
    if (!markFormName.trim()) { toast({ title: t.customMarks.nameRequired, variant: 'destructive' }); return; }
    if (!markFormAttribute) { toast({ title: t.customMarks.attributeRequired, variant: 'destructive' }); return; }
    if (!markFormDescription.trim()) { toast({ title: t.customMarks.descriptionRequired, variant: 'destructive' }); return; }
    if (!markFormEffect.trim()) { toast({ title: t.customMarks.effectRequired, variant: 'destructive' }); return; }

    setIsSubmitting(true);
    try {
      if (editingMark) {
        const { error } = await supabase.from('minor_marks').update({
          name: markFormName.trim(), attribute: markFormAttribute,
          description: markFormDescription.trim(), effect: markFormEffect.trim(),
        }).eq('id', editingMark.id);
        if (error) throw error;
        setMarks((prev) => prev.map((m) => m.id === editingMark.id ? { ...m, name: markFormName.trim(), attribute: markFormAttribute, description: markFormDescription.trim(), effect: markFormEffect.trim() } : m));
        toast({ title: t.customMarks.markUpdated });
      } else {
        const { data, error } = await supabase.from('minor_marks').insert({
          name: markFormName.trim(), attribute: markFormAttribute,
          description: markFormDescription.trim(), effect: markFormEffect.trim(),
          created_by: user.id,
        }).select().single();
        if (error) throw error;
        setMarks((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: t.customMarks.markCreated });
      }
      setShowMarkModal(false);
      resetMarkForm();
    } catch (error: any) {
      toast({ title: t.common.errorSaving, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDelete = async () => {
    if (!deleteMarkTarget) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('minor_marks').delete().eq('id', deleteMarkTarget.id);
      if (error) throw error;
      setMarks((prev) => prev.filter((m) => m.id !== deleteMarkTarget.id));
      toast({ title: t.customMarks.markDeleted });
    } catch (error: any) {
      toast({ title: t.common.errorDeleting, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setDeleteMarkTarget(null);
    }
  };

  // ---- Merits/Flaws CRUD ----
  const resetMfForm = () => {
    setFormName(''); setFormDescription(''); setFormCost(0);
    setFormCategory('physical'); setFormPrerequisites('');
    setFormSourcebook(''); setFormGameSystems([]);
    setEditingItem(null);
  };

  const openCreateMf = () => { resetMfForm(); setShowMfModal(true); };

  const openEditMf = (item: MeritFlaw) => {
    setFormName(item.name); setFormDescription(item.description); setFormCost(item.cost);
    setFormCategory(item.category); setFormPrerequisites(item.prerequisites || '');
    setFormSourcebook(item.sourcebook || ''); setFormGameSystems(item.game_systems || ['vampiro_v3']);
    setEditingItem(item); setShowMfModal(true);
  };

  const toggleGameSystem = (systemId: string) => {
    setFormGameSystems((prev) => prev.includes(systemId) ? prev.filter((s) => s !== systemId) : [...prev, systemId]);
  };

  const handleMfSubmit = async () => {
    if (!user) return;
    if (!formName.trim()) { toast({ title: t.meritsFlaws.nameRequired, variant: 'destructive' }); return; }
    if (!formDescription.trim()) { toast({ title: t.meritsFlaws.descriptionRequired, variant: 'destructive' }); return; }
    if (formGameSystems.length === 0) { toast({ title: t.meritsFlaws.categoryRequired, variant: 'destructive' }); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(), description: formDescription.trim(), cost: formCost,
        category: formCategory, prerequisites: formPrerequisites.trim() || null,
        sourcebook: formSourcebook.trim() || null, game_systems: formGameSystems,
      };

      if (editingItem) {
        const { error } = await supabase.from('merits_flaws').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        setItems((prev) => prev.map((m) => m.id === editingItem.id ? { ...m, ...payload } : m));
        toast({ title: t.meritsFlaws.itemUpdated });
      } else {
        const { data, error } = await supabase.from('merits_flaws').insert({ ...payload, created_by: user.id }).select().single();
        if (error) throw error;
        setItems((prev) => [...prev, data as MeritFlaw].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: t.meritsFlaws.itemCreated });
      }
      setShowMfModal(false);
      resetMfForm();
    } catch (error: any) {
      toast({ title: t.common.errorSaving, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfDelete = async () => {
    if (!deleteMfTarget) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('merits_flaws').delete().eq('id', deleteMfTarget.id);
      if (error) throw error;
      setItems((prev) => prev.filter((m) => m.id !== deleteMfTarget.id));
      toast({ title: t.meritsFlaws.itemDeleted });
    } catch (error: any) {
      toast({ title: t.common.errorDeleting, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setDeleteMfTarget(null);
    }
  };

  const categoryLabel = (cat: string) => t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string || cat;

  // ---- Pagination helpers ----
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  // ---- Loading ----
  if (authLoading || marksLoading || mfLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">{t.common.loading}</div>
      </div>
    );
  }

  const handleCreate = () => {
    if (activeTab === 'marks') openCreateMark();
    else openCreateMf();
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
              {t.customization.title}
            </h1>
          </div>

          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">
              {activeTab === 'marks' ? t.customMarks.newMark : t.meritsFlaws.newMeritFlaw}
            </span>
            <span className="sm:hidden">
              {activeTab === 'marks' ? t.customMarks.newMark : t.meritsFlaws.newMeritFlaw}
            </span>
          </Button>
        </div>
      </header>

      {/* Tabs + Search + Filters */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-[65px] z-40">
        <div className="container mx-auto px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.customization.searchPlaceholder}
              className="pl-9 font-body"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* System filter — always visible */}
            <Select value={filterSystem} onValueChange={setFilterSystem}>
              <SelectTrigger className="w-[180px] font-body text-sm h-9">
                <SelectValue placeholder={t.meritsFlaws.filterBySystem} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.meritsFlaws.allSystems}</SelectItem>
                {getMfSystems().map((sys) => (
                  <SelectItem key={sys.id} value={sys.id}>
                    {getMfSystemLabel(sys.id, t.meritsFlaws.lobisomemOrShifter)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === 'merits_flaws' && (
              <>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px] font-body text-sm h-9">
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

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px] font-body text-sm h-9">
                    <SelectValue placeholder={t.meritsFlaws.filterByType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.meritsFlaws.allTypes}</SelectItem>
                    <SelectItem value="merit">{t.meritsFlaws.meritsOnly}</SelectItem>
                    <SelectItem value="flaw">{t.meritsFlaws.flawsOnly}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCost} onValueChange={setFilterCost}>
                  <SelectTrigger className="w-[180px] font-body text-sm h-9">
                    <SelectValue placeholder={t.customization.filterByCost} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.customization.allCosts}</SelectItem>
                    <SelectItem value="1">1 {t.meritsFlaws.points}</SelectItem>
                    <SelectItem value="2">2 {t.meritsFlaws.points}</SelectItem>
                    <SelectItem value="3">3 {t.meritsFlaws.points}</SelectItem>
                    <SelectItem value="4">4 {t.meritsFlaws.points}</SelectItem>
                    <SelectItem value="5">5 {t.meritsFlaws.points}</SelectItem>
                    <SelectItem value="6+">6+ {t.meritsFlaws.points}</SelectItem>
                  </SelectContent>
                </Select>

                {availableSourcebooks.length > 0 && (
                  <Select value={filterSourcebook} onValueChange={setFilterSourcebook}>
                    <SelectTrigger className="w-[220px] font-body text-sm h-9">
                      <SelectValue placeholder={t.meritsFlaws.filterBySourcebook} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.meritsFlaws.allSourcebooks}</SelectItem>
                      {availableSourcebooks.map((book) => (
                        <SelectItem key={book} value={book}>{book}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}

            {activeTab === 'marks' && (
              <Select value={filterAttribute} onValueChange={setFilterAttribute}>
                <SelectTrigger className="w-[180px] font-body text-sm h-9">
                  <SelectValue placeholder={t.customization.filterByAttribute} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.customization.allAttributes}</SelectItem>
                  {attributeOptions.map((attr) => (
                    <SelectItem key={attr} value={attr}>
                      {t.attributes[attr as keyof typeof t.attributes]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground font-body">
            {currentItems.length} {t.customization.results}
            {totalPages > 1 && ` — ${t.customization.page} ${currentPage}/${totalPages}`}
          </p>
        </div>

        {currentItems.length === 0 ? (
          <Card className="medieval-card">
            <CardContent className="py-12 text-center">
              {activeTab === 'marks' ? (
                <>
                  <Scroll className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medieval text-xl mb-2">{t.customMarks.noCustomMarks}</h3>
                  <p className="text-muted-foreground font-body mb-6">{t.customMarks.createUniqueMarks}</p>
                  <Button onClick={openCreateMark}>
                    <Plus className="w-4 h-4 mr-2" />{t.customMarks.createFirstMark}
                  </Button>
                </>
              ) : (
                <>
                  <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medieval text-xl mb-2">{t.meritsFlaws.noItems}</h3>
                  <p className="text-muted-foreground font-body mb-6">{t.meritsFlaws.createFirst}</p>
                  <Button onClick={openCreateMf}>
                    <Plus className="w-4 h-4 mr-2" />{t.meritsFlaws.createFirstButton}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {activeTab === 'marks'
              ? (paginatedItems as CustomMark[]).map((mark) => {
                  const Icon = attributeIcons[mark.attribute] || Star;
                  return (
                    <Card key={mark.id} className="medieval-card overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-medieval text-base">{mark.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {t.attributes[mark.attribute as keyof typeof t.attributes]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-body mb-1">{mark.description}</p>
                            <p className="text-sm text-primary font-body italic">{mark.effect}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => openEditMark(mark)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteMarkTarget(mark)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              : (paginatedItems as MeritFlaw[]).map((item) => {
                  const Icon = categoryIcons[item.category] || Star;
                  const isMerit = item.cost > 0;
                  return (
                    <Card key={item.id} className="medieval-card overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMerit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <Icon className={`w-5 h-5 ${isMerit ? 'text-green-500' : 'text-red-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-medieval text-base">{toTitleCase(item.name)}</h3>
                              <Badge variant="outline" className={isMerit ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}>
                                {isMerit ? '+' : ''}{item.cost} {t.meritsFlaws.points}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">{categoryLabel(item.category)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-body mb-1">{item.description}</p>
                            {item.prerequisites && (
                              <p className="text-xs text-muted-foreground/70 font-body italic">
                                {t.meritsFlaws.prerequisites}: {item.prerequisites}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {[...new Set(item.game_systems?.filter((sys) => sys !== 'metamorfos_w20').map((sys) => {
                                if (sys === 'lobisomem_w20') return t.meritsFlaws.lobisomemOrShifter;
                                const system = GAME_SYSTEMS.find((s) => s.id === sys);
                                return system?.shortName || sys;
                              }) || [])].map((label) => (
                                <Badge key={label} variant="outline" className="text-xs">{label}</Badge>
                              ))}
                              {item.sourcebook && <Badge variant="outline" className="text-xs text-muted-foreground">{item.sourcebook}</Badge>}
                            </div>
                          </div>
                          {(item.created_by === user?.id || user?.email === 'jordao@jordaobevilaqua.com') && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => openEditMf(item)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteMfTarget(item)}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page as number)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* ---- Mark Modal ---- */}
      <Dialog open={showMarkModal} onOpenChange={setShowMarkModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-medieval">
              {editingMark ? t.customMarks.editMark : t.marks.createCustom}
            </DialogTitle>
            <DialogDescription className="font-body">{t.customMarks.defineDetails}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-medieval">{t.customMarks.markName} *</Label>
              <Input value={markFormName} onChange={(e) => setMarkFormName(e.target.value)} placeholder={t.customMarks.markNamePlaceholder} className="font-body" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.marks.attribute} *</Label>
              <Select value={markFormAttribute} onValueChange={setMarkFormAttribute}>
                <SelectTrigger className="font-body"><SelectValue placeholder={t.customMarks.selectAttribute} /></SelectTrigger>
                <SelectContent>
                  {attributeOptions.map((attr) => {
                    const Icon = attributeIcons[attr];
                    return (
                      <SelectItem key={attr} value={attr}>
                        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><span>{t.attributes[attr as keyof typeof t.attributes]}</span></div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.marks.description} *</Label>
              <Textarea value={markFormDescription} onChange={(e) => setMarkFormDescription(e.target.value)} placeholder={t.customMarks.descriptionPlaceholder} className="font-body min-h-[80px] resize-none" maxLength={1000} />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.marks.effect} *</Label>
              <Textarea value={markFormEffect} onChange={(e) => setMarkFormEffect(e.target.value)} placeholder={t.customMarks.effectPlaceholder} className="font-body min-h-[80px] resize-none" maxLength={1000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkModal(false)} disabled={isSubmitting}>{t.common.cancel}</Button>
            <Button onClick={handleMarkSubmit} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.common.loading}</> : editingMark ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- MF Modal ---- */}
      <Dialog open={showMfModal} onOpenChange={setShowMfModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-medieval">{editingItem ? t.meritsFlaws.editItem : t.meritsFlaws.createItem}</DialogTitle>
            <DialogDescription className="font-body">{t.meritsFlaws.defineDetails}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.name} *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t.meritsFlaws.namePlaceholder} className="font-body" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.cost}</Label>
              <Input type="number" value={formCost} onChange={(e) => setFormCost(parseInt(e.target.value) || 0)} className="font-body" min={-7} max={7} />
              <p className="text-xs text-muted-foreground">{t.meritsFlaws.costHint}</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.category}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">{t.meritsFlaws.physical}</SelectItem>
                  <SelectItem value="social">{t.meritsFlaws.social}</SelectItem>
                  <SelectItem value="mental">{t.meritsFlaws.mental}</SelectItem>
                  <SelectItem value="supernatural">{t.meritsFlaws.supernatural}</SelectItem>
                  <SelectItem value="other">{t.meritsFlaws.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.description} *</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={t.meritsFlaws.descriptionPlaceholder} className="font-body min-h-[80px] resize-none" maxLength={2000} />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.prerequisites}</Label>
              <Input value={formPrerequisites} onChange={(e) => setFormPrerequisites(e.target.value)} placeholder={t.meritsFlaws.prerequisitesPlaceholder} className="font-body" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.sourcebook}</Label>
              <Input value={formSourcebook} onChange={(e) => setFormSourcebook(e.target.value)} placeholder={t.meritsFlaws.sourcebookPlaceholder} className="font-body" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label className="font-medieval">{t.meritsFlaws.gameSystems} *</Label>
              <div className="space-y-2">
                {getMfSystems().map((sys) => (
                  <div key={sys.id} className="flex items-center gap-2">
                    <Checkbox id={`system-${sys.id}`} checked={formGameSystems.includes(sys.id)} onCheckedChange={() => toggleGameSystem(sys.id)} />
                    <Label htmlFor={`system-${sys.id}`} className="font-body cursor-pointer">
                      {getMfSystemLabel(sys.id, t.meritsFlaws.lobisomemOrShifter)}
                    </Label>
                  </div>
                ))}
              </div>
              {formGameSystems.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  {t.meritsFlaws.selectAtLeastOneSystem}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMfModal(false)} disabled={isSubmitting}>{t.common.cancel}</Button>
            <Button onClick={handleMfSubmit} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.common.loading}</> : editingItem ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Mark Confirmation ---- */}
      <AlertDialog open={!!deleteMarkTarget} onOpenChange={() => setDeleteMarkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medieval">{t.customMarks.deleteMark}</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {t.customMarks.deleteConfirm} <strong>{deleteMarkTarget?.name}</strong>? {t.customMarks.cannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- Delete MF Confirmation ---- */}
      <AlertDialog open={!!deleteMfTarget} onOpenChange={() => setDeleteMfTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medieval">{t.meritsFlaws.deleteItem}</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {t.meritsFlaws.deleteConfirm} <strong>{deleteMfTarget?.name}</strong>? {t.meritsFlaws.cannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleMfDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
