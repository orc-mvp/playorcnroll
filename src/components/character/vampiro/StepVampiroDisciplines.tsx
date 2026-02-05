import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star } from 'lucide-react';
import DotRating from './DotRating';
import { VampiroFormData } from './StepVampiroBasicInfo';

interface StepVampiroDisciplinesProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

// All disciplines organized by book with bilingual labels
const DISCIPLINES_BY_BOOK = [
  {
    book: "Vampire: The Masquerade Revised Edition",
    bookPt: "Vampiro: A Máscara (Revised Edition)",
    disciplines: [
      { key: 'animalism', labelPt: 'Animalismo', labelEn: 'Animalism' },
      { key: 'auspex', labelPt: 'Auspícios', labelEn: 'Auspex' },
      { key: 'celerity', labelPt: 'Celeridade', labelEn: 'Celerity' },
      { key: 'chimerstry', labelPt: 'Quimerismo', labelEn: 'Chimerstry' },
      { key: 'dementation', labelPt: 'Demência', labelEn: 'Dementation' },
      { key: 'dominate', labelPt: 'Dominação', labelEn: 'Dominate' },
      { key: 'fortitude', labelPt: 'Fortitude', labelEn: 'Fortitude' },
      { key: 'necromancy', labelPt: 'Necromancia', labelEn: 'Necromancy' },
      { key: 'obfuscate', labelPt: 'Ofuscação', labelEn: 'Obfuscate' },
      { key: 'obtenebration', labelPt: 'Obtenebração', labelEn: 'Obtenebration' },
      { key: 'potence', labelPt: 'Potência', labelEn: 'Potence' },
      { key: 'presence', labelPt: 'Presença', labelEn: 'Presence' },
      { key: 'protean', labelPt: 'Metamorfose', labelEn: 'Protean' },
      { key: 'quietus', labelPt: 'Quietus', labelEn: 'Quietus' },
      { key: 'serpentis', labelPt: 'Serpentis', labelEn: 'Serpentis' },
      { key: 'thaumaturgy', labelPt: 'Taumaturgia', labelEn: 'Thaumaturgy' },
      { key: 'vicissitude', labelPt: 'Vicissitude', labelEn: 'Vicissitude' },
    ]
  },
  {
    book: "Guide to the Camarilla",
    bookPt: "Guia da Camarilla",
    disciplines: [
      { key: 'gargoyle_flight', labelPt: 'Voo de Gárgula', labelEn: 'Gargoyle Flight' },
      { key: 'visceratika', labelPt: 'Visceratika', labelEn: 'Visceratika' },
    ]
  },
  {
    book: "Vampire Storytellers Handbook Revised",
    bookPt: "Manual do Narrador de Vampiro (Revised)",
    disciplines: [
      { key: 'daimoinon', labelPt: 'Daimoinon', labelEn: 'Daimoinon' },
      { key: 'temporis', labelPt: 'Temporis', labelEn: 'Temporis' },
    ]
  },
  {
    book: "Storytellers Handbook to the Sabbat",
    bookPt: "Manual do Narrador do Sabbat",
    disciplines: [
      { key: 'mytherceria', labelPt: 'Mytherceria', labelEn: 'Mytherceria' },
      { key: 'spiritus', labelPt: 'Spiritus', labelEn: 'Spiritus' },
    ]
  },
  {
    book: "Guide to the Sabbat",
    bookPt: "Guia do Sabbat",
    disciplines: [
      { key: 'sanguinus', labelPt: 'Sanguinus', labelEn: 'Sanguinus' },
    ]
  },
  {
    book: "Clanbook: Salubri",
    bookPt: "Livro de Clã: Salubri",
    disciplines: [
      { key: 'valeren', labelPt: 'Valeren', labelEn: 'Valeren' },
    ]
  },
  {
    book: "Blood Magic: Secrets of Thaumaturgy",
    bookPt: "Magia de Sangue: Segredos da Taumaturgia",
    disciplines: [
      { key: 'koldunic_sorcery', labelPt: 'Feitiçaria Koldúnica', labelEn: 'Koldunic Sorcery' },
    ]
  },
  {
    book: "Dirty Secrets of the Black Hand",
    bookPt: "Segredos Sujos da Mão Negra",
    disciplines: [
      { key: 'nihilistics', labelPt: 'Nihilistics', labelEn: 'Nihilistics' },
    ]
  },
  {
    book: "Vampire Storytellers Companion",
    bookPt: "Companheiro do Narrador de Vampiro",
    disciplines: [
      { key: 'obeah', labelPt: 'Obeah', labelEn: 'Obeah' },
      { key: 'melpominee', labelPt: 'Melpominee', labelEn: 'Melpominee' },
      { key: 'thanatosis', labelPt: 'Thanatosis', labelEn: 'Thanatosis' },
    ]
  },
];

// Clan disciplines mapping (using keys)
const CLAN_DISCIPLINES: Record<string, string[]> = {
  'Brujah': ['celerity', 'potence', 'presence'],
  'Gangrel': ['animalism', 'fortitude', 'protean'],
  'Malkavian': ['auspex', 'dementation', 'obfuscate'],
  'Nosferatu': ['animalism', 'obfuscate', 'potence'],
  'Toreador': ['auspex', 'celerity', 'presence'],
  'Tremere': ['auspex', 'dominate', 'thaumaturgy'],
  'Ventrue': ['dominate', 'fortitude', 'presence'],
  'Caitiff': ['animalism', 'auspex', 'celerity', 'dementation', 'dominate', 'fortitude', 'protean', 'obfuscate', 'potence', 'presence'],
  'Assamita': ['celerity', 'obfuscate', 'quietus'],
  'Lasombra': ['dominate', 'obtenebration', 'potence'],
  'Tzimisce': ['animalism', 'auspex', 'vicissitude'],
  'Giovanni': ['dominate', 'necromancy', 'potence'],
  'Ravnos': ['animalism', 'fortitude', 'chimerstry'],
  'Setita': ['obfuscate', 'presence', 'serpentis'],
};

// Helper to get discipline info by key
const getAllDisciplines = () => {
  const map: Record<string, { labelPt: string; labelEn: string }> = {};
  DISCIPLINES_BY_BOOK.forEach(book => {
    book.disciplines.forEach(d => {
      map[d.key] = { labelPt: d.labelPt, labelEn: d.labelEn };
    });
  });
  return map;
};

const DISCIPLINE_MAP = getAllDisciplines();

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

  // Get clan discipline keys
  const clanDisciplineKeys = CLAN_DISCIPLINES[formData.clan] || [];

  const updateDiscipline = (disciplineKey: string, value: number) => {
    updateFormData({
      disciplines: {
        ...disciplines,
        [disciplineKey]: value,
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

  // Get label for a discipline
  const getDisciplineLabel = (key: string) => {
    const info = DISCIPLINE_MAP[key];
    if (!info) return key;
    return language === 'pt-BR' ? info.labelPt : info.labelEn;
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
              ? 'Poderes sobrenaturais do seu vampiro (0-10)'
              : 'Supernatural powers of your vampire (0-10)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {/* Clan Disciplines - Highlighted Section */}
            {clanDisciplineKeys.length > 0 && (
              <div className="mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medieval text-sm text-primary">
                    {language === 'pt-BR' 
                      ? `Disciplinas do Clã (${formData.clan})` 
                      : `Clan Disciplines (${formData.clan})`}
                  </span>
                </div>
                <div className="space-y-2">
                  {clanDisciplineKeys.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-4 pl-2">
                      <span className="font-body text-sm">{getDisciplineLabel(key)}</span>
                      <DotRating
                        value={disciplines[key] || 0}
                        onChange={(value) => updateDiscipline(key, value)}
                        maxValue={10}
                        minValue={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Disciplines by Book */}
            <Accordion type="multiple" className="w-full">
              {DISCIPLINES_BY_BOOK.map((bookGroup) => {
                // Filter out clan disciplines to avoid duplication
                const filteredDisciplines = bookGroup.disciplines.filter(
                  d => !clanDisciplineKeys.includes(d.key)
                );
                
                if (filteredDisciplines.length === 0) return null;

                return (
                  <AccordionItem key={bookGroup.book} value={bookGroup.book} className="border-border/50">
                    <AccordionTrigger className="font-medieval text-sm hover:no-underline py-3">
                      {language === 'pt-BR' ? bookGroup.bookPt : bookGroup.book}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-4">
                      {filteredDisciplines.map((d) => (
                        <div key={d.key} className="flex items-center justify-between gap-4 pl-2">
                          <span className="font-body text-sm">
                            {language === 'pt-BR' ? d.labelPt : d.labelEn}
                          </span>
                          <DotRating
                            value={disciplines[d.key] || 0}
                            onChange={(value) => updateDiscipline(d.key, value)}
                            maxValue={10}
                            minValue={0}
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
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
