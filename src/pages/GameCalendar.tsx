import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserMenu } from '@/components/UserMenu';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Plus, Trash2, ArrowLeft, Pencil } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import logoLateral from '@/assets/logo-orcnroll-lateral.webp';

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  description: string | null;
  created_at: string;
  profile?: { display_name: string | null };
}

const ADMIN_ID = '8b192f50-8f9a-484e-aa64-d71af69fbdb8';

export default function GameCalendar() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  const locale = language === 'pt-BR' ? ptBR : enUS;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    // Fetch profiles for display names
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const eventsWithProfiles = data.map(e => ({
        ...e,
        profile: profileMap.get(e.user_id) || { display_name: null },
      }));
      setEvents(eventsWithProfiles);
    } else {
      setEvents([]);
    }
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => fetchEvents()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents]);

  const handleAddEvent = async () => {
    if (!user || !selectedDate || !newTitle.trim()) return;

    const { error } = await supabase.from('calendar_events').insert({
      user_id: user.id,
      title: newTitle.trim(),
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      description: newDescription.trim() || null,
    });

    if (error) {
      toast({ title: t.common.errorSaving, variant: 'destructive' });
      return;
    }

    toast({ title: t.calendar.eventAdded });
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDescription(event.description || '');
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newTitle.trim()) return;

    const { error } = await supabase
      .from('calendar_events')
      .update({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      })
      .eq('id', editingEvent.id);

    if (error) {
      toast({ title: t.common.errorSaving, variant: 'destructive' });
      return;
    }

    toast({ title: t.calendar.eventUpdated });
    setEditingEvent(null);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    if (error) {
      toast({ title: t.common.errorDeleting, variant: 'destructive' });
    }
  };

  const isAdmin = user?.id === ADMIN_ID;

  const eventsForSelectedDate = selectedDate
    ? events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))
    : [];

  const eventDates = events.map(e => parseISO(e.event_date));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={logoLateral} alt="Orc and Roll" className="h-8 sm:h-10 object-contain" />
          </Link>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medieval text-2xl md:text-3xl text-foreground">
            {t.calendar.title}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="medieval-card">
            <CardContent className="p-4 flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={locale}
                className="pointer-events-auto"
                modifiers={{ hasEvent: eventDates }}
                modifiersClassNames={{ hasEvent: 'bg-primary/20 font-bold text-primary' }}
              />
              <Button
                className="mt-4 w-full"
                onClick={() => setShowAddModal(true)}
                disabled={!selectedDate}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.calendar.addEvent}
              </Button>
            </CardContent>
          </Card>

          {/* Events for selected date */}
          <Card className="medieval-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-medieval text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                {selectedDate
                  ? format(selectedDate, 'PPP', { locale })
                  : t.calendar.selectDate}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingEvents ? (
                <p className="text-muted-foreground text-sm">{t.common.loading}</p>
              ) : eventsForSelectedDate.length === 0 ? (
                <p className="text-muted-foreground text-sm font-body">
                  {t.calendar.noEvents}
                </p>
              ) : (
                eventsForSelectedDate.map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border border-border bg-card/50 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medieval text-sm font-semibold truncate">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground font-body">
                            {event.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 font-body mt-1">
                          {t.calendar.createdBy}: {event.profile?.display_name || t.calendar.anonymous}
                        </p>
                      </div>
                      {(event.user_id === user.id || isAdmin) && (
                        <div className="flex shrink-0 gap-1">
                          {event.user_id === user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Event Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-medieval">{t.calendar.addEvent}</DialogTitle>
            <DialogDescription className="font-body">
              {selectedDate && format(selectedDate, 'PPP', { locale })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t.calendar.eventTitle}</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={t.calendar.eventTitlePlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t.calendar.eventDescription}
              </label>
              <Textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder={t.calendar.eventDescriptionPlaceholder}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleAddEvent} disabled={!newTitle.trim()}>
                {t.common.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) { setEditingEvent(null); setNewTitle(''); setNewDescription(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-medieval">{t.calendar.editEvent}</DialogTitle>
            <DialogDescription className="font-body">
              {editingEvent && format(parseISO(editingEvent.event_date), 'PPP', { locale })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t.calendar.eventTitle}</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={t.calendar.eventTitlePlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t.calendar.eventDescription}
              </label>
              <Textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder={t.calendar.eventDescriptionPlaceholder}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditingEvent(null); setNewTitle(''); setNewDescription(''); }}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleUpdateEvent} disabled={!newTitle.trim()}>
                {t.common.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
