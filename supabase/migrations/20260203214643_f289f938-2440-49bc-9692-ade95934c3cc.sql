-- Profiles table for user data (role selection, preferences)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('narrator', 'player')),
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR' CHECK (language IN ('pt-BR', 'en')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Characters table
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  concept TEXT,
  -- Attribute types: 'strong' (+2), 'neutral' (+1), 'weak' (+0)
  aggression_type TEXT NOT NULL DEFAULT 'neutral' CHECK (aggression_type IN ('strong', 'neutral', 'weak')),
  determination_type TEXT NOT NULL DEFAULT 'neutral' CHECK (determination_type IN ('strong', 'neutral', 'weak')),
  seduction_type TEXT NOT NULL DEFAULT 'neutral' CHECK (seduction_type IN ('strong', 'neutral', 'weak')),
  cunning_type TEXT NOT NULL DEFAULT 'neutral' CHECK (cunning_type IN ('strong', 'neutral', 'weak')),
  faith_type TEXT NOT NULL DEFAULT 'neutral' CHECK (faith_type IN ('strong', 'neutral', 'weak')),
  -- Minor marks (array of mark IDs)
  minor_marks UUID[] DEFAULT '{}',
  -- Major marks (JSON array with name, scope, effect, is_temporary, is_permanent)
  major_marks JSONB DEFAULT '[]',
  -- Epic marks
  epic_marks JSONB DEFAULT '[]',
  -- Negative marks
  negative_marks JSONB DEFAULT '[]',
  -- Mark progress (theme -> points)
  mark_progress JSONB DEFAULT '{}',
  -- Extended narratives (NPCs, reputations, resources)
  extended_narratives JSONB DEFAULT '[]',
  -- Heroic moves stored (max 1)
  heroic_moves_stored INTEGER NOT NULL DEFAULT 0 CHECK (heroic_moves_stored >= 0 AND heroic_moves_stored <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Minor marks library (predefined + custom per campaign)
CREATE TABLE public.minor_marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  attribute TEXT NOT NULL CHECK (attribute IN ('aggression', 'determination', 'seduction', 'cunning', 'faith')),
  description TEXT NOT NULL,
  effect TEXT NOT NULL,
  -- NULL means it's a system-wide predefined mark, otherwise it's custom to a session
  session_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narrator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'ended')),
  current_scene_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session participants (players in a session)
CREATE TABLE public.session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Scenes table
CREATE TABLE public.scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for current_scene_id
ALTER TABLE public.sessions 
  ADD CONSTRAINT fk_current_scene 
  FOREIGN KEY (current_scene_id) 
  REFERENCES public.scenes(id) ON DELETE SET NULL;

-- Complications table
CREATE TABLE public.complications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reputational', 'tracking', 'betrayal', 'debt', 'minor_curse')),
  description TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_manifested BOOLEAN NOT NULL DEFAULT false,
  manifest_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  manifested_at TIMESTAMP WITH TIME ZONE
);

-- Tests (dice rolls) table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('individual', 'group')),
  attribute TEXT NOT NULL CHECK (attribute IN ('aggression', 'determination', 'seduction', 'cunning', 'faith')),
  difficulty INTEGER NOT NULL DEFAULT 0 CHECK (difficulty >= -2 AND difficulty <= 3),
  context TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rolling', 'completed')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Test rolls (individual dice rolls for a test)
CREATE TABLE public.test_rolls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dice1 INTEGER CHECK (dice1 >= 1 AND dice1 <= 6),
  dice2 INTEGER CHECK (dice2 >= 1 AND dice2 <= 6),
  attribute_modifier INTEGER NOT NULL,
  difficulty_modifier INTEGER NOT NULL,
  total INTEGER,
  result TEXT CHECK (result IN ('success', 'partial', 'failure')),
  has_positive_extreme BOOLEAN DEFAULT false,
  has_negative_extreme BOOLEAN DEFAULT false,
  heroic_move_choice TEXT CHECK (heroic_move_choice IN ('major_mark', 'accumulate', 'narrative', 'pull_group')),
  pull_group_used BOOLEAN DEFAULT false,
  rolled_at TIMESTAMP WITH TIME ZONE
);

-- Session events (feed of what happened)
CREATE TABLE public.session_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minor_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Characters: Users can manage their own characters, narrators can view characters in their sessions
CREATE POLICY "Users can view own characters" ON public.characters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters" ON public.characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters" ON public.characters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" ON public.characters
  FOR DELETE USING (auth.uid() = user_id);

-- Narrators can view characters of players in their sessions
CREATE POLICY "Narrators can view session characters" ON public.characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants sp
      JOIN public.sessions s ON s.id = sp.session_id
      WHERE sp.character_id = characters.id
      AND s.narrator_id = auth.uid()
    )
  );

-- Minor marks: Everyone can view, only creators of custom marks can edit
CREATE POLICY "Anyone can view minor marks" ON public.minor_marks
  FOR SELECT USING (true);

CREATE POLICY "Narrators can create custom marks" ON public.minor_marks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Narrators can update own custom marks" ON public.minor_marks
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Narrators can delete own custom marks" ON public.minor_marks
  FOR DELETE USING (auth.uid() = created_by);

-- Sessions: Narrators can manage, participants can view
CREATE POLICY "Narrators can manage own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = narrator_id);

CREATE POLICY "Participants can view sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_id = sessions.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view sessions by invite code" ON public.sessions
  FOR SELECT USING (true);

-- Session participants: Narrators and participants can view
CREATE POLICY "Narrators can manage participants" ON public.session_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_participants.session_id
      AND narrator_id = auth.uid()
    )
  );

CREATE POLICY "Players can join sessions" ON public.session_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can view other participants" ON public.session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants sp
      WHERE sp.session_id = session_participants.session_id
      AND sp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_participants.session_id
      AND s.narrator_id = auth.uid()
    )
  );

-- Scenes: Session participants and narrators can view
CREATE POLICY "Session members can view scenes" ON public.scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_id = scenes.session_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = scenes.session_id
      AND narrator_id = auth.uid()
    )
  );

CREATE POLICY "Narrators can manage scenes" ON public.scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = scenes.session_id
      AND narrator_id = auth.uid()
    )
  );

-- Complications: Narrators can manage, players can view their own (if visible)
CREATE POLICY "Narrators can manage complications" ON public.complications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = complications.session_id
      AND narrator_id = auth.uid()
    )
  );

CREATE POLICY "Players can view own visible complications" ON public.complications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE id = complications.character_id
      AND user_id = auth.uid()
    )
    AND (is_visible = true OR is_manifested = true)
  );

-- Tests: Session members can view and interact
CREATE POLICY "Session members can view tests" ON public.tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_id = tests.session_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = tests.session_id
      AND narrator_id = auth.uid()
    )
  );

CREATE POLICY "Narrators can create tests" ON public.tests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = tests.session_id
      AND narrator_id = auth.uid()
    )
  );

CREATE POLICY "Narrators can update tests" ON public.tests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = tests.session_id
      AND narrator_id = auth.uid()
    )
  );

-- Test rolls: Players can roll for themselves, everyone in session can view
CREATE POLICY "Session members can view test rolls" ON public.test_rolls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      JOIN public.session_participants sp ON sp.session_id = t.session_id
      WHERE t.id = test_rolls.test_id
      AND sp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tests t
      JOIN public.sessions s ON s.id = t.session_id
      WHERE t.id = test_rolls.test_id
      AND s.narrator_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert own rolls" ON public.test_rolls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update own rolls" ON public.test_rolls
  FOR UPDATE USING (auth.uid() = user_id);

-- Session events: Session members can view
CREATE POLICY "Session members can view events" ON public.session_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_id = session_events.session_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_events.session_id
      AND narrator_id = auth.uid()
    )
  );

CREATE POLICY "Narrators can insert events" ON public.session_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_events.session_id
      AND narrator_id = auth.uid()
    )
  );

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_rolls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complications;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert predefined minor marks
INSERT INTO public.minor_marks (name, attribute, description, effect) VALUES
-- Aggression marks
('Mestre de Armas', 'aggression', 'Treinamento extensivo com diversas armas de combate.', 'Pode usar qualquer arma com proficiência, improvisando se necessário.'),
('Veterano de Batalha', 'aggression', 'Experiência em múltiplos conflitos armados.', 'Reconhece táticas inimigas e pontos fracos em formações.'),
('Lutador de Rua', 'aggression', 'Anos de brigas em vielas e tabernas.', 'Avalia rapidamente oponentes e identifica ameaças ocultas.'),
('Fúria Controlada', 'aggression', 'Canaliza raiva em força devastadora.', 'Pode entrar em estado de fúria, ganhando força mas perdendo sutileza.'),
('Caçador', 'aggression', 'Experiência rastreando e abatendo presas.', 'Rastreia criaturas e conhece pontos vitais de animais e monstros.'),

-- Determination marks
('Vontade de Ferro', 'determination', 'Resiliência mental extraordinária.', 'Resiste a manipulação mental e mantém foco sob pressão extrema.'),
('Sobrevivente', 'determination', 'Passou por provações que matariam outros.', 'Suporta dor, fome e exaustão muito além do normal.'),
('Líder Nato', 'determination', 'Presença que inspira outros a seguir.', 'Inspira coragem em aliados e coordena grupos sob pressão.'),
('Guardião', 'determination', 'Dedicação inabalável a proteger outros.', 'Interpõe-se instintivamente para proteger aliados em perigo.'),
('Incansável', 'determination', 'Reservas de energia que parecem inesgotáveis.', 'Pode agir sem descanso por períodos muito maiores que o normal.'),

-- Seduction marks
('Charme Natural', 'seduction', 'Magnetismo pessoal inato.', 'Pessoas tendem a baixar a guarda e confiar naturalmente.'),
('Cortesão', 'seduction', 'Treinamento em etiqueta e jogos de poder.', 'Navega intrigas políticas e sociais com facilidade.'),
('Performer', 'seduction', 'Talento para entreter e cativar audiências.', 'Captura atenção de grupos e muda o humor de multidões.'),
('Sedutor', 'seduction', 'Mestria na arte da atração romântica.', 'Desperta interesse romântico e usa isso estrategicamente.'),
('Diplomata', 'seduction', 'Habilidade em negociação e mediação.', 'Encontra termos aceitáveis entre partes em conflito.'),

-- Cunning marks
('Sombras', 'cunning', 'Movimenta-se sem ser visto ou ouvido.', 'Infiltra-se em locais protegidos e escapa de vigilância.'),
('Trapaceiro', 'cunning', 'Dedos ágeis e mente mais ágil ainda.', 'Executa truques de mão, furtos e trapaças com maestria.'),
('Estrategista', 'cunning', 'Mente analítica para planos complexos.', 'Cria planos elaborados e antecipa movimentos adversários.'),
('Investigador', 'cunning', 'Olho treinado para detalhes reveladores.', 'Encontra pistas que outros perdem e deduz conexões ocultas.'),
('Falsário', 'cunning', 'Talento para criar imitações convincentes.', 'Falsifica documentos, cria disfarces e imita vozes.'),

-- Faith marks
('Devoto', 'faith', 'Fé inabalável em poder superior.', 'Orações ocasionalmente recebem respostas tangíveis.'),
('Curandeiro', 'faith', 'Conhecimento de ervas e cuidados médicos.', 'Trata ferimentos e doenças com métodos tradicionais.'),
('Vidente', 'faith', 'Sensibilidade ao sobrenatural.', 'Percebe presenças sobrenaturais e tem pressentimentos.'),
('Exorcista', 'faith', 'Treinamento para lidar com o maligno.', 'Reconhece possessões e sabe rituais de banimento.'),
('Conselheiro Espiritual', 'faith', 'Sabedoria para guiar almas perdidas.', 'Acalma pessoas em crise e oferece perspectivas que curam.');