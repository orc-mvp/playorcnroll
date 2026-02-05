import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import DotRating from './DotRating';
import { VampiroFormData } from './StepVampiroBasicInfo';

interface StepVampiroDisciplinesProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

// Clan disciplines mapping
const CLAN_DISCIPLINES: Record<string, string[]> = {
  'Brujah': ['Celeridade', 'Potência', 'Presença'],
  'Gangrel': ['Animalismo', 'Fortitude', 'Metamorfose'],
  'Malkavian': ['Auspícios', 'Demência', 'Ofuscação'],
  'Nosferatu': ['Animalismo', 'Ofuscação', 'Potência'],
  'Toreador': ['Auspícios', 'Celeridade', 'Presença'],
  'Tremere': ['Auspícios', 'Dominação', 'Taumaturgia'],
  'Ventrue': ['Dominação', 'Fortitude', 'Presença'],
  'Caitiff': ['Animalismo', 'Auspícios', 'Celeridade', 'Demência', 'Dominação', 'Fortitude', 'Metamorfose', 'Ofuscação', 'Potência', 'Presença'],
  'Assamita': ['Celeridade', 'Ofuscação', 'Quietus'],
  'Lasombra': ['Dominação', 'Obtenebração', 'Potência'],
  'Tzimisce': ['Animalismo', 'Auspícios', 'Vicissitude'],
  'Giovanni': ['Dominação', 'Necromancia', 'Potência'],
  'Ravnos': ['Animalismo', 'Fortitude', 'Quimerismo'],
  'Setita': ['Ofuscação', 'Presença', 'Serpentis'],
};

// Backgrounds organized by source book
const BACKGROUNDS_BY_BOOK = [
  {
    book: "Vampiro: A Máscara (Revised / 3ª edição)",
    bookEn: "Vampire: The Masquerade (Revised / 3rd edition)",
    backgrounds: [
      { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
      { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
      { key: 'fame', labelPt: 'Fama', labelEn: 'Fame' },
      { key: 'generation', labelPt: 'Geração', labelEn: 'Generation' },
      { key: 'herd', labelPt: 'Rebanho', labelEn: 'Herd' },
      { key: 'influence', labelPt: 'Influência', labelEn: 'Influence' },
      { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
      { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
      { key: 'retainers', labelPt: 'Lacaios', labelEn: 'Retainers' },
      { key: 'status', labelPt: 'Status', labelEn: 'Status' },
      { key: 'elysium', labelPt: 'Elysium', labelEn: 'Elysium' },
      { key: 'age', labelPt: 'Idade', labelEn: 'Age' },
      { key: 'elder_status', labelPt: 'Status de Ancião', labelEn: 'Elder Status' },
      { key: 'elder_generation', labelPt: 'Geração de Ancião', labelEn: 'Elder Generation' },
      { key: 'military_force', labelPt: 'Força Militar', labelEn: 'Military Force' },
    ]
  },
  {
    book: "Vampire Storytellers Handbook (Revised)",
    bookEn: "Vampire Storytellers Handbook (Revised)",
    backgrounds: [
      { key: 'vsh_age', labelPt: 'Idade', labelEn: 'Age' },
      { key: 'arcane', labelPt: 'Arcano', labelEn: 'Arcane' },
      { key: 'vsh_military_force', labelPt: 'Força Militar', labelEn: 'Military Force' },
    ]
  },
  {
    book: "Dirty Secrets of the Black Hand",
    bookEn: "Dirty Secrets of the Black Hand",
    backgrounds: [
      { key: 'dsbh_age', labelPt: 'Idade', labelEn: 'Age' },
    ]
  },
  {
    book: "Guide to the Sabbat",
    bookEn: "Guide to the Sabbat",
    backgrounds: [
      { key: 'alternate_identity', labelPt: 'Identidade Alternativa', labelEn: 'Alternate Identity' },
      { key: 'black_hand_membership', labelPt: 'Filiação à Mão Negra', labelEn: 'Black Hand Membership' },
      { key: 'rituals', labelPt: 'Rituais', labelEn: 'Rituals' },
      { key: 'sabbat_status', labelPt: 'Status no Sabbat', labelEn: 'Sabbat Status' },
    ]
  },
  {
    book: "The Players Guide to the Sabbat",
    bookEn: "The Players Guide to the Sabbat",
    backgrounds: [
      { key: 'pgs_alternate_identity', labelPt: 'Identidade Alternativa', labelEn: 'Alternate Identity' },
      { key: 'pgs_black_hand', labelPt: 'Filiação à Mão Negra', labelEn: 'Black Hand Membership' },
      { key: 'pack_recognition', labelPt: 'Reconhecimento de Bando', labelEn: 'Pack Recognition' },
    ]
  },
  {
    book: "Ghouls: Fatal Addiction",
    bookEn: "Ghouls: Fatal Addiction",
    backgrounds: [
      { key: 'domitor', labelPt: 'Domitor', labelEn: 'Domitor' },
    ]
  },
  {
    book: "Clanbook: Nosferatu (Revised)",
    bookEn: "Clanbook: Nosferatu (Revised)",
    backgrounds: [
      { key: 'information_network', labelPt: 'Rede de Informações', labelEn: 'Information Network' },
    ]
  },
  {
    book: "Time of Thin Blood",
    bookEn: "Time of Thin Blood",
    backgrounds: [
      { key: 'insight', labelPt: 'Insight', labelEn: 'Insight' },
    ]
  },
  {
    book: "Inquisition",
    bookEn: "Inquisition",
    backgrounds: [
      { key: 'mob', labelPt: 'Turba', labelEn: 'Mob' },
      { key: 'relic', labelPt: 'Relíquia', labelEn: 'Relic' },
    ]
  },
  {
    book: "Blood Magic: Secrets of Thaumaturgy",
    bookEn: "Blood Magic: Secrets of Thaumaturgy",
    backgrounds: [
      { key: 'occult_library', labelPt: 'Biblioteca Oculta', labelEn: 'Occult Library' },
    ]
  },
  {
    book: "The Hunters Hunted",
    bookEn: "The Hunters Hunted",
    backgrounds: [
      { key: 'reputation', labelPt: 'Reputação', labelEn: 'Reputation' },
    ]
  },
  {
    book: "Clanbook: Giovanni (Revised)",
    bookEn: "Clanbook: Giovanni (Revised)",
    backgrounds: [
      { key: 'spirit_slaves', labelPt: 'Escravos Espirituais', labelEn: 'Spirit Slaves' },
    ]
  },
];

export default function StepVampiroDisciplines({ formData, updateFormData }: StepVampiroDisciplinesProps) {
  const { language } = useI18n();

  // Defensive defaults
  const disciplines = formData.disciplines || {};
  const backgrounds = formData.backgrounds || {};

  // Get clan disciplines
  const clanDisciplines = CLAN_DISCIPLINES[formData.clan] || [];

  const updateDiscipline = (discipline: string, value: number) => {
    updateFormData({
      disciplines: {
        ...disciplines,
        [discipline]: value,
      },
    });
  };

  const updateBackground = (background: string, value: number) => {
    updateFormData({
      backgrounds: {
        ...backgrounds,
        [background]: value,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Disciplines Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Disciplinas' : 'Disciplines'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? `Disciplinas do clã ${formData.clan || 'selecionado'}`
              : `Disciplines of the ${formData.clan || 'selected'} clan`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {clanDisciplines.length > 0 ? (
            clanDisciplines.map((discipline) => (
              <div key={discipline} className="flex items-center justify-between gap-4">
                <span className="font-body text-sm">{discipline}</span>
                <DotRating
                  value={disciplines[discipline] || 0}
                  onChange={(value) => updateDiscipline(discipline, value)}
                  maxValue={5}
                  minValue={0}
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              {language === 'pt-BR'
                ? 'Selecione um clã na etapa 1 para ver as disciplinas disponíveis'
                : 'Select a clan in step 1 to see available disciplines'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Backgrounds Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Antecedentes' : 'Backgrounds'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Recursos, conexões e vantagens do seu vampiro'
              : 'Resources, connections and advantages of your vampire'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="multiple" defaultValue={["Vampiro: A Máscara (Revised / 3ª edição)"]} className="w-full">
              {BACKGROUNDS_BY_BOOK.map((bookGroup) => (
                <AccordionItem key={bookGroup.book} value={bookGroup.book} className="border-border/50">
                  <AccordionTrigger className="font-medieval text-sm hover:no-underline py-3">
                    {language === 'pt-BR' ? bookGroup.book : bookGroup.bookEn}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-4">
                    {bookGroup.backgrounds.map((bg) => (
                      <div key={bg.key} className="flex items-center justify-between gap-4 pl-2">
                        <span className="font-body text-sm">
                          {language === 'pt-BR' ? bg.labelPt : bg.labelEn}
                        </span>
                        <DotRating
                          value={backgrounds[bg.key] || 0}
                          onChange={(value) => updateBackground(bg.key, value)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
