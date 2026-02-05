-- Adicionar game_system nas sessões
ALTER TABLE sessions 
ADD COLUMN game_system text NOT NULL DEFAULT 'herois_marcados';

-- Adicionar game_system nos personagens
ALTER TABLE characters 
ADD COLUMN game_system text NOT NULL DEFAULT 'herois_marcados';