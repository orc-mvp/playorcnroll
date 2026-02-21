import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { User, Shield, Brain, Heart, Moon, Star, BookOpen, Sparkles } from 'lucide-react';
import DotRating from './DotRating';

// Types
interface VampiroData {
  player?: string;
  chronicle?: string;
  nature?: string;
  demeanor?: string;
  clan?: string;
  generation?: string;
  sire?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  abilities?: {
    talents: Record<string, number>;
    skills: Record<string, number>;
    knowledges: Record<string, number>;
  };
  specializations?: Record<string, string>;
  virtues?: {
    virtueType1: string;
    virtueValue1: number;
    virtueType2: string;
    virtueValue2: number;
    courage: number;
  };
  moralityType?: string;
  pathName?: string;
  humanity?: number;
  willpower?: number;
  disciplines?: Record<string, number>;
  backgrounds?: Record<string, number>;
  merits_flaws?: { id: string; name: string; cost: number; category: string }[];
}

interface Character {
  id: string;
  name: string;
  concept: string | null;
  vampiro_data: VampiroData | null;
}

interface EditVampiroCharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  onSave: (updated: Character) => void;
}

const CLANS = [
  { value: 'Brujah', label: 'Brujah' },
  { value: 'Gangrel', label: 'Gangrel' },
  { value: 'Malkavian', label: 'Malkaviano' },
  { value: 'Nosferatu', label: 'Nosferatu' },
  { value: 'Toreador', label: 'Toreador' },
  { value: 'Tremere', label: 'Tremere' },
  { value: 'Ventrue', label: 'Ventrue' },
  { value: 'Lasombra', label: 'Lasombra' },
  { value: 'Tzimisce', label: 'Tzimisce' },
  { value: 'Assamita', label: 'Assamita' },
  { value: 'Setita', label: 'Seguidores de Set' },
  { value: 'Giovanni', label: 'Giovanni' },
  { value: 'Ravnos', label: 'Ravnos' },
  { value: 'Caitiff', label: 'Caitiff' },
];

const ARCHETYPES = [
  'Arquiteto', 'Autocrata', 'Bon Vivant', 'Bravo', 'Burocrata', 'Camaleão',
  'Capitalista', 'Cavaleiro', 'Celebrante', 'Competidor', 'Conformista',
  'Defensor', 'Devasso', 'Diretor', 'Fanático', 'Galante', 'Guru',
  'Idealista', 'Juiz', 'Loner', 'Mártir', 'Masoquista', 'Mediador',
  'Monstro', 'Oportunista', 'Pedagogo', 'Penitente', 'Perfeccionista',
  'Predador', 'Rebelde', 'Sádico', 'Sobrevivente', 'Soldado', 'Tradicionalista',
  'Visionário',
];

const ABILITY_NAMES: Record<string, Record<string, string>> = {
  talents: {
    alertness: 'Prontidão',
    athletics: 'Esportes',
    brawl: 'Briga',
    dodge: 'Esquiva',
    empathy: 'Empatia',
    expression: 'Expressão',
    intimidation: 'Intimidação',
    leadership: 'Liderança',
    streetwise: 'Manha',
    subterfuge: 'Lábia',
  },
  skills: {
    animalKen: 'Empatia c/ Animais',
    crafts: 'Ofícios',
    drive: 'Condução',
    etiquette: 'Etiqueta',
    firearms: 'Armas de Fogo',
    melee: 'Armas Brancas',
    performance: 'Performance',
    security: 'Segurança',
    stealth: 'Furtividade',
    survival: 'Sobrevivência',
  },
  knowledges: {
    academics: 'Acadêmicos',
    computer: 'Computador',
    finance: 'Finanças',
    investigation: 'Investigação',
    law: 'Direito',
    linguistics: 'Linguística',
    medicine: 'Medicina',
    occult: 'Ocultismo',
    politics: 'Política',
    science: 'Ciência',
  },
};

// Disciplines organized by book
const DISCIPLINES_BY_BOOK = [
  {
    book: "Vampire: The Masquerade Revised Edition",
    bookPt: "Vampiro: A Máscara (Revised Edition)",
    disciplines: [
      { key: "animalism", labelPt: "Animalismo", labelEn: "Animalism" },
      { key: "auspex", labelPt: "Auspícios", labelEn: "Auspex" },
      { key: "celerity", labelPt: "Celeridade", labelEn: "Celerity" },
      { key: "chimerstry", labelPt: "Quimerismo", labelEn: "Chimerstry" },
      { key: "dementation", labelPt: "Demência", labelEn: "Dementation" },
      { key: "dominate", labelPt: "Dominação", labelEn: "Dominate" },
      { key: "fortitude", labelPt: "Fortitude", labelEn: "Fortitude" },
      { key: "necromancy", labelPt: "Necromancia", labelEn: "Necromancy" },
      { key: "obfuscate", labelPt: "Ofuscação", labelEn: "Obfuscate" },
      { key: "obtenebration", labelPt: "Obtenebração", labelEn: "Obtenebration" },
      { key: "potence", labelPt: "Potência", labelEn: "Potence" },
      { key: "presence", labelPt: "Presença", labelEn: "Presence" },
      { key: "protean", labelPt: "Metamorfose", labelEn: "Protean" },
      { key: "quietus", labelPt: "Quietus", labelEn: "Quietus" },
      { key: "serpentis", labelPt: "Serpentis", labelEn: "Serpentis" },
      { key: "thaumaturgy", labelPt: "Taumaturgia", labelEn: "Thaumaturgy" },
      { key: "vicissitude", labelPt: "Vicissitude", labelEn: "Vicissitude" },
    ],
  },
  {
    book: "Guide to the Camarilla",
    bookPt: "Guia da Camarilla",
    disciplines: [
      { key: "gargoyle_flight", labelPt: "Voo de Gárgula", labelEn: "Gargoyle Flight" },
      { key: "visceratika", labelPt: "Visceratika", labelEn: "Visceratika" },
    ],
  },
  {
    book: "Vampire Storytellers Handbook Revised",
    bookPt: "Manual do Narrador de Vampiro (Revised)",
    disciplines: [
      { key: "daimoinon", labelPt: "Daimoinon", labelEn: "Daimoinon" },
      { key: "temporis", labelPt: "Temporis", labelEn: "Temporis" },
    ],
  },
  {
    book: "Storytellers Handbook to the Sabbat",
    bookPt: "Manual do Narrador do Sabbat",
    disciplines: [
      { key: "mytherceria", labelPt: "Mytherceria", labelEn: "Mytherceria" },
      { key: "spiritus", labelPt: "Spiritus", labelEn: "Spiritus" },
    ],
  },
  {
    book: "Guide to the Sabbat",
    bookPt: "Guia do Sabbat",
    disciplines: [{ key: "sanguinus", labelPt: "Sanguinus", labelEn: "Sanguinus" }],
  },
  {
    book: "Clanbook: Salubri",
    bookPt: "Livro de Clã: Salubri",
    disciplines: [{ key: "valeren", labelPt: "Valeren", labelEn: "Valeren" }],
  },
  {
    book: "Blood Magic: Secrets of Thaumaturgy",
    bookPt: "Magia de Sangue: Segredos da Taumaturgia",
    disciplines: [{ key: "koldunic_sorcery", labelPt: "Feitiçaria Koldúnica", labelEn: "Koldunic Sorcery" }],
  },
  {
    book: "Dirty Secrets of the Black Hand",
    bookPt: "Segredos Sujos da Mão Negra",
    disciplines: [{ key: "nihilistics", labelPt: "Nihilistics", labelEn: "Nihilistics" }],
  },
  {
    book: "Vampire Storytellers Companion",
    bookPt: "Companheiro do Narrador de Vampiro",
    disciplines: [
      { key: "obeah", labelPt: "Obeah", labelEn: "Obeah" },
      { key: "melpominee", labelPt: "Melpominee", labelEn: "Melpominee" },
      { key: "thanatosis", labelPt: "Thanatosis", labelEn: "Thanatosis" },
    ],
  },
];

const CLAN_DISCIPLINES: Record<string, string[]> = {
  Brujah: ["celerity", "potence", "presence"],
  Gangrel: ["animalism", "fortitude", "protean"],
  Malkavian: ["auspex", "dementation", "obfuscate"],
  Nosferatu: ["animalism", "obfuscate", "potence"],
  Toreador: ["auspex", "celerity", "presence"],
  Tremere: ["auspex", "dominate", "thaumaturgy"],
  Ventrue: ["dominate", "fortitude", "presence"],
  Caitiff: ["animalism","auspex","celerity","dementation","dominate","fortitude","protean","obfuscate","potence","presence"],
  Assamita: ["celerity", "obfuscate", "quietus"],
  Lasombra: ["dominate", "obtenebration", "potence"],
  Tzimisce: ["animalism", "auspex", "vicissitude"],
  Giovanni: ["dominate", "necromancy", "potence"],
  Ravnos: ["animalism", "fortitude", "chimerstry"],
  Setita: ["obfuscate", "presence", "serpentis"],
};

const BACKGROUNDS_BY_BOOK = [
  {
    book: "Vampiro: A Máscara (Revised / 3ª edição)",
    bookEn: "Vampire: The Masquerade (Revised / 3rd edition)",
    backgrounds: [
      { key: "allies", labelPt: "Aliados", labelEn: "Allies" },
      { key: "contacts", labelPt: "Contatos", labelEn: "Contacts" },
      { key: "fame", labelPt: "Fama", labelEn: "Fame" },
      { key: "generation", labelPt: "Geração", labelEn: "Generation" },
      { key: "herd", labelPt: "Rebanho", labelEn: "Herd" },
      { key: "influence", labelPt: "Influência", labelEn: "Influence" },
      { key: "mentor", labelPt: "Mentor", labelEn: "Mentor" },
      { key: "resources", labelPt: "Recursos", labelEn: "Resources" },
      { key: "retainers", labelPt: "Lacaios", labelEn: "Retainers" },
      { key: "status", labelPt: "Status", labelEn: "Status" },
      { key: "elysium", labelPt: "Elysium", labelEn: "Elysium" },
      { key: "elder_status", labelPt: "Status de Ancião", labelEn: "Elder Status" },
      { key: "elder_generation", labelPt: "Geração de Ancião", labelEn: "Elder Generation" },
    ],
  },
  {
    book: "Vampire Storytellers Handbook (Revised)",
    bookEn: "Vampire Storytellers Handbook (Revised)",
    backgrounds: [
      { key: "vsh_age", labelPt: "Idade", labelEn: "Age" },
      { key: "arcane", labelPt: "Arcano", labelEn: "Arcane" },
      { key: "vsh_military_force", labelPt: "Força Militar", labelEn: "Military Force" },
    ],
  },
  {
    book: "Dirty Secrets of the Black Hand",
    bookEn: "Dirty Secrets of the Black Hand",
    backgrounds: [{ key: "dsbh_age", labelPt: "Idade", labelEn: "Age" }],
  },
  {
    book: "Guide to the Sabbat",
    bookEn: "Guide to the Sabbat",
    backgrounds: [
      { key: "alternate_identity", labelPt: "Identidade Alternativa", labelEn: "Alternate Identity" },
      { key: "black_hand_membership", labelPt: "Filiação à Mão Negra", labelEn: "Black Hand Membership" },
      { key: "rituals", labelPt: "Rituais", labelEn: "Rituals" },
      { key: "sabbat_status", labelPt: "Status no Sabbat", labelEn: "Sabbat Status" },
    ],
  },
  {
    book: "The Players Guide to the Sabbat",
    bookEn: "The Players Guide to the Sabbat",
    backgrounds: [
      { key: "pgs_alternate_identity", labelPt: "Identidade Alternativa", labelEn: "Alternate Identity" },
      { key: "pgs_black_hand", labelPt: "Filiação à Mão Negra", labelEn: "Black Hand Membership" },
      { key: "pack_recognition", labelPt: "Reconhecimento de Bando", labelEn: "Pack Recognition" },
    ],
  },
  {
    book: "Ghouls: Fatal Addiction",
    bookEn: "Ghouls: Fatal Addiction",
    backgrounds: [{ key: "domitor", labelPt: "Domitor", labelEn: "Domitor" }],
  },
  {
    book: "Clanbook: Nosferatu (Revised)",
    bookEn: "Clanbook: Nosferatu (Revised)",
    backgrounds: [{ key: "information_network", labelPt: "Rede de Informações", labelEn: "Information Network" }],
  },
  {
    book: "Time of Thin Blood",
    bookEn: "Time of Thin Blood",
    backgrounds: [{ key: "insight", labelPt: "Insight", labelEn: "Insight" }],
  },
  {
    book: "Inquisition",
    bookEn: "Inquisition",
    backgrounds: [
      { key: "mob", labelPt: "Turba", labelEn: "Mob" },
      { key: "relic", labelPt: "Relíquia", labelEn: "Relic" },
    ],
  },
  {
    book: "Blood Magic: Secrets of Thaumaturgy",
    bookEn: "Blood Magic: Secrets of Thaumaturgy",
    backgrounds: [{ key: "occult_library", labelPt: "Biblioteca Oculta", labelEn: "Occult Library" }],
  },
  {
    book: "The Hunters Hunted",
    bookEn: "The Hunters Hunted",
    backgrounds: [{ key: "reputation", labelPt: "Reputação", labelEn: "Reputation" }],
  },
  {
    book: "Clanbook: Giovanni (Revised)",
    bookEn: "Clanbook: Giovanni (Revised)",
    backgrounds: [{ key: "spirit_slaves", labelPt: "Escravos Espirituais", labelEn: "Spirit Slaves" }],
  },
];

const getAllDisciplinesMap = () => {
  const map: Record<string, { labelPt: string; labelEn: string }> = {};
  DISCIPLINES_BY_BOOK.forEach((book) => {
    book.disciplines.forEach((d) => {
      map[d.key] = { labelPt: d.labelPt, labelEn: d.labelEn };
    });
  });
  return map;
};
const DISCIPLINE_MAP = getAllDisciplinesMap();

export function EditVampiroCharacterModal({
  open,
  onOpenChange,
  character,
  onSave,
}: EditVampiroCharacterModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [vampiroData, setVampiroData] = useState<VampiroData>(character.vampiro_data || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [availableMeritsFlaws, setAvailableMeritsFlaws] = useState<{ id: string; name: string; description: string; cost: number; category: string; prerequisites: string | null }[]>([]);

  // Reset form when character changes
  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setVampiroData(character.vampiro_data || {});
  }, [character]);

  // Fetch available merits/flaws
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('merits_flaws')
        .select('id, name, description, cost, category, prerequisites')
        .contains('game_systems', ['vampiro_v3'])
        .order('category')
        .order('cost', { ascending: false })
        .order('name');
      if (data) setAvailableMeritsFlaws(data);
    };
    if (open) fetch();
  }, [open]);

  const updateVampiroField = <K extends keyof VampiroData>(key: K, value: VampiroData[K]) => {
    setVampiroData(prev => ({ ...prev, [key]: value }));
  };

  const updateAttribute = (category: 'physical' | 'social' | 'mental', attr: string, value: number) => {
    setVampiroData(prev => ({
      ...prev,
      attributes: {
        physical: prev.attributes?.physical || { strength: 1, dexterity: 1, stamina: 1 },
        social: prev.attributes?.social || { charisma: 1, manipulation: 1, appearance: 1 },
        mental: prev.attributes?.mental || { perception: 1, intelligence: 1, wits: 1 },
        [category]: {
          ...prev.attributes?.[category],
          [attr]: value,
        },
      },
    }));
  };

  const updateAbility = (category: 'talents' | 'skills' | 'knowledges', ability: string, value: number) => {
    setVampiroData(prev => ({
      ...prev,
      abilities: {
        talents: prev.abilities?.talents || {},
        skills: prev.abilities?.skills || {},
        knowledges: prev.abilities?.knowledges || {},
        [category]: {
          ...prev.abilities?.[category],
          [ability]: value,
        },
      },
    }));
  };

  const updateDiscipline = (key: string, value: number) => {
    setVampiroData(prev => ({
      ...prev,
      disciplines: {
        ...prev.disciplines,
        [key]: value,
      },
    }));
  };

  const updateBackground = (key: string, value: number) => {
    setVampiroData(prev => ({
      ...prev,
      backgrounds: {
        ...prev.backgrounds,
        [key]: value,
      },
    }));
  };

  const updateVirtue = (key: string, value: number | string) => {
    setVampiroData(prev => ({
      ...prev,
      virtues: {
        ...prev.virtues,
        virtueType1: prev.virtues?.virtueType1 || 'conscience',
        virtueValue1: prev.virtues?.virtueValue1 || 1,
        virtueType2: prev.virtues?.virtueType2 || 'selfControl',
        virtueValue2: prev.virtues?.virtueValue2 || 1,
        courage: prev.virtues?.courage || 1,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t.editVampiro.nameRequired,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('characters')
        .update({
          name: name.trim(),
          concept: concept.trim() || null,
          vampiro_data: JSON.parse(JSON.stringify(vampiroData)),
        })
        .eq('id', character.id);

      if (error) throw error;

      const updated: Character = {
        ...character,
        name: name.trim(),
        concept: concept.trim() || null,
        vampiro_data: vampiroData,
      };

      onSave(updated);
      toast({
        title: t.editVampiro.characterUpdated,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating character:', error);
      toast({
        title: t.editVampiro.errorSaving,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const attributes = vampiroData.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };

  const abilities = vampiroData.abilities || { talents: {}, skills: {}, knowledges: {} };
  const disciplines = vampiroData.disciplines || {};
  const backgrounds = vampiroData.backgrounds || {};
  const clanDisciplineKeys = CLAN_DISCIPLINES[vampiroData.clan || ''] || [];
  const virtues = vampiroData.virtues || {
    virtueType1: 'conscience',
    virtueValue1: 1,
    virtueType2: 'selfControl',
    virtueValue2: 1,
    courage: 1,
  };

  const getDisciplineLabel = (key: string) => {
    const info = DISCIPLINE_MAP[key];
    if (!info) return key;
    return language === 'pt-BR' ? info.labelPt : info.labelEn;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            {t.editVampiro.editCharacter}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t.editVampiro.editVampireInfo}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full font-medieval shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t.editVampiro.tabBasic}
                </div>
              </SelectItem>
              <SelectItem value="attributes">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t.editVampiro.tabAttributes}
                </div>
              </SelectItem>
              <SelectItem value="abilities">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  {t.editVampiro.tabAbilities}
                </div>
              </SelectItem>
              <SelectItem value="disciplines">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {t.editVampiro.tabDisciplines}
                </div>
              </SelectItem>
              <SelectItem value="backgrounds">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t.editVampiro.tabBackgrounds}
                </div>
              </SelectItem>
              <SelectItem value="meritsflaws">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t.meritsFlaws.title}
                </div>
              </SelectItem>
              <SelectItem value="virtues">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {t.editVampiro.tabVirtues}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 mt-4 min-h-0">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.character.name} *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.editVampiro.characterName}
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.player}</Label>
                    <Input
                      value={vampiroData.player || ''}
                      onChange={(e) => updateVampiroField('player', e.target.value)}
                      placeholder={t.editVampiro.playerName}
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.chronicle}</Label>
                    <Input
                      value={vampiroData.chronicle || ''}
                      onChange={(e) => updateVampiroField('chronicle', e.target.value)}
                      placeholder={t.editVampiro.chronicleName}
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.clan}</Label>
                    <Select
                      value={vampiroData.clan || ''}
                      onValueChange={(val) => updateVampiroField('clan', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.selectClan} />
                      </SelectTrigger>
                      <SelectContent>
                        {CLANS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.nature}</Label>
                    <Select
                      value={vampiroData.nature || ''}
                      onValueChange={(val) => updateVampiroField('nature', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHETYPES.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.demeanor}</Label>
                    <Select
                      value={vampiroData.demeanor || ''}
                      onValueChange={(val) => updateVampiroField('demeanor', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHETYPES.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.generation}</Label>
                    <Select
                      value={vampiroData.generation || ''}
                      onValueChange={(val) => updateVampiroField('generation', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {[8, 9, 10, 11, 12, 13].map(g => (
                          <SelectItem key={g} value={String(g)}>{g}ª Geração</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.sire}</Label>
                    <Input
                      value={vampiroData.sire || ''}
                      onChange={(e) => updateVampiroField('sire', e.target.value)}
                      placeholder={t.editVampiro.sireName}
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medieval">{t.character.concept}</Label>
                  <Input
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder={t.editVampiro.conceptPlaceholder}
                    className="font-body"
                  />
                </div>
                </div>
              </TabsContent>

              {/* Attributes Tab */}
              <TabsContent value="attributes" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                {/* Physical */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.physical}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'strength', label: t.vampiro.strength },
                      { key: 'dexterity', label: t.vampiro.dexterity },
                      { key: 'stamina', label: t.vampiro.stamina },
                    ].map(attr => (
                      <div key={attr.key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{attr.label}</span>
                        <DotRating
                          value={attributes.physical[attr.key as keyof typeof attributes.physical] || 1}
                          onChange={(val) => updateAttribute('physical', attr.key, val)}
                          maxValue={5}
                          minValue={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.social}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'charisma', label: t.vampiro.charisma },
                      { key: 'manipulation', label: t.vampiro.manipulation },
                      { key: 'appearance', label: t.vampiro.appearance },
                    ].map(attr => (
                      <div key={attr.key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{attr.label}</span>
                        <DotRating
                          value={attributes.social[attr.key as keyof typeof attributes.social] || 1}
                          onChange={(val) => updateAttribute('social', attr.key, val)}
                          maxValue={5}
                          minValue={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mental */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.mental}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'perception', label: t.vampiro.perception },
                      { key: 'intelligence', label: t.vampiro.intelligence },
                      { key: 'wits', label: t.vampiro.wits },
                    ].map(attr => (
                      <div key={attr.key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{attr.label}</span>
                        <DotRating
                          value={attributes.mental[attr.key as keyof typeof attributes.mental] || 1}
                          onChange={(val) => updateAttribute('mental', attr.key, val)}
                          maxValue={5}
                          minValue={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </TabsContent>

              {/* Abilities Tab */}
              <TabsContent value="abilities" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                {/* Talents */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {t.vampiro.talents}{' '}
                    <span className="text-muted-foreground/60">({Object.values(abilities.talents).reduce((s, v) => s + (v || 0), 0)})</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(ABILITY_NAMES.talents).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.vampiro[key as keyof typeof t.vampiro] || label}</span>
                        <DotRating
                          value={abilities.talents[key] || 0}
                          onChange={(val) => updateAbility('talents', key, val)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {t.vampiro.skills}{' '}
                    <span className="text-muted-foreground/60">({Object.values(abilities.skills).reduce((s, v) => s + (v || 0), 0)})</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(ABILITY_NAMES.skills).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.vampiro[key as keyof typeof t.vampiro] || label}</span>
                        <DotRating
                          value={abilities.skills[key] || 0}
                          onChange={(val) => updateAbility('skills', key, val)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knowledges */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {t.vampiro.knowledges}{' '}
                    <span className="text-muted-foreground/60">({Object.values(abilities.knowledges).reduce((s, v) => s + (v || 0), 0)})</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(ABILITY_NAMES.knowledges).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.vampiro[key as keyof typeof t.vampiro] || label}</span>
                        <DotRating
                          value={abilities.knowledges[key] || 0}
                          onChange={(val) => updateAbility('knowledges', key, val)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </TabsContent>

              {/* Disciplines Tab */}
              <TabsContent value="disciplines" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {/* Clan Disciplines */}
                  {clanDisciplineKeys.length > 0 && (
                    <div className="pb-3 border-b border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-medieval text-sm text-primary">
                          {language === 'pt-BR'
                            ? `Disciplinas do Clã (${vampiroData.clan})`
                            : `Clan Disciplines (${vampiroData.clan})`}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {clanDisciplineKeys.map((key) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="font-body text-sm">{getDisciplineLabel(key)}</span>
                            <DotRating
                              value={disciplines[key] || 0}
                              onChange={(val) => updateDiscipline(key, val)}
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
                      const filtered = bookGroup.disciplines.filter((d) => !clanDisciplineKeys.includes(d.key));
                      if (filtered.length === 0) return null;
                      return (
                        <AccordionItem key={bookGroup.book} value={bookGroup.book} className="border-border/50">
                          <AccordionTrigger className="font-medieval text-sm hover:no-underline py-3">
                            {language === 'pt-BR' ? bookGroup.bookPt : bookGroup.book}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {filtered.map((d) => (
                              <div key={d.key} className="flex items-center justify-between">
                                <span className="font-body text-sm">{language === 'pt-BR' ? d.labelPt : d.labelEn}</span>
                                <DotRating
                                  value={disciplines[d.key] || 0}
                                  onChange={(val) => updateDiscipline(d.key, val)}
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
                </div>
              </TabsContent>

              {/* Backgrounds Tab */}
              <TabsContent value="backgrounds" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <Accordion type="multiple" defaultValue={["Vampiro: A Máscara (Revised / 3ª edição)"]} className="w-full">
                  {BACKGROUNDS_BY_BOOK.map((bookGroup) => (
                    <AccordionItem key={bookGroup.book} value={bookGroup.book} className="border-border/50">
                      <AccordionTrigger className="font-medieval text-sm hover:no-underline py-3">
                        {language === 'pt-BR' ? bookGroup.book : bookGroup.bookEn}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pb-4">
                        {bookGroup.backgrounds.map((bg) => (
                          <div key={bg.key} className="flex items-center justify-between">
                            <span className="font-body text-sm">{language === 'pt-BR' ? bg.labelPt : bg.labelEn}</span>
                            <DotRating
                              value={backgrounds[bg.key] || 0}
                              onChange={(val) => updateBackground(bg.key, val)}
                              maxValue={5}
                              minValue={0}
                            />
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              {/* Merits & Flaws Tab */}
              <TabsContent value="meritsflaws" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-3">
                  {(() => {
                    const selectedMF = (vampiroData.merits_flaws || []) as { id: string; name: string; cost: number; category: string }[];
                    const totalCost = selectedMF.reduce((s, m) => s + m.cost, 0);
                    const freebiePoints = 15;
                    const remaining = freebiePoints - totalCost;
                    const categoryLabelFn = (cat: string) =>
                      (t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string) || cat;

                    const toggleMeritFlaw = (item: typeof availableMeritsFlaws[0]) => {
                      const isSelected = selectedMF.some((s) => s.id === item.id);
                      const updated = isSelected
                        ? selectedMF.filter((s) => s.id !== item.id)
                        : [...selectedMF, { id: item.id, name: item.name, cost: item.cost, category: item.category }];
                      setVampiroData(prev => ({ ...prev, merits_flaws: updated }));
                    };

                    return (
                      <>
                        <div className="flex items-center justify-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                          <span className="font-medieval text-xs">{t.meritsFlaws.freebiePoints}:</span>
                          <Badge variant="outline" className={`text-xs ${remaining >= 0 ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                            {remaining} {t.meritsFlaws.freebieRemaining} ({t.meritsFlaws.freebieTotal} {freebiePoints})
                          </Badge>
                        </div>
                        {availableMeritsFlaws.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground font-body text-sm">
                            {language === 'pt-BR' ? 'Nenhuma disponível.' : 'None available.'}
                          </div>
                        ) : (
                          availableMeritsFlaws.map((item) => {
                            const isChecked = selectedMF.some((s) => s.id === item.id);
                            const isMerit = item.cost > 0;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/30'}`}
                                onClick={() => toggleMeritFlaw(item)}
                              >
                                <Checkbox checked={isChecked} onCheckedChange={() => toggleMeritFlaw(item)} className="mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-medieval text-xs">{item.name}</span>
                                    <Badge variant="outline" className={`text-[10px] ${isMerit ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                                      {isMerit ? '+' : ''}{item.cost}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px]">{categoryLabelFn(item.category)}</Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-1">{item.description}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    );
                  })()}
                </div>
              </TabsContent>

              {/* Virtues Tab */}
              <TabsContent value="virtues" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.virtues}</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">
                        {virtues.virtueType1 === 'conscience' ? t.vampiro.conscience : t.vampiro.conviction}
                      </span>
                      <DotRating
                        value={virtues.virtueValue1 || 1}
                        onChange={(val) => updateVirtue('virtueValue1', val)}
                        maxValue={5}
                        minValue={1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">
                        {virtues.virtueType2 === 'selfControl' ? t.vampiro.selfControl : t.vampiro.instinct}
                      </span>
                      <DotRating
                        value={virtues.virtueValue2 || 1}
                        onChange={(val) => updateVirtue('virtueValue2', val)}
                        maxValue={5}
                        minValue={1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.vampiro.courage}</span>
                      <DotRating
                        value={virtues.courage || 1}
                        onChange={(val) => updateVirtue('courage', val)}
                        maxValue={5}
                        minValue={1}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {vampiroData.moralityType === 'path' ? `${t.vampiro.path}: ${vampiroData.pathName}` : t.vampiro.humanity}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{t.editVampiro.value}</span>
                    <DotRating
                      value={vampiroData.humanity || 1}
                      onChange={(val) => updateVampiroField('humanity', val)}
                      maxValue={10}
                      minValue={0}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.willpower}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{t.editVampiro.value}</span>
                    <DotRating
                      value={vampiroData.willpower || 1}
                      onChange={(val) => updateVampiroField('willpower', val)}
                      maxValue={10}
                      minValue={1}
                    />
                  </div>
                </div>
                </div>
              </TabsContent>
          </div>
        </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.editVampiro.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
