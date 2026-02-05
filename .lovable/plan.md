

# Plano: Notificacoes Visuais para Sangue e Forca de Vontade Zerados

## Resumo

Implementar alertas visuais automaticos quando um jogador fica sem sangue (blood pool = 0) ou sem forca de vontade (willpower = 0), notificando tanto o jogador quanto o Narrador para criar momentos dramaticos e garantir que estados criticos nao passem despercebidos.

---

## Experiencia do Usuario

### Para o Jogador:
- Quando o sangue chegar a 0, aparece um banner animado vermelho/pulsante no topo do tracker com icone de alerta
- Quando a forca de vontade chegar a 0, aparece um banner similar indicando estado critico
- Toast notification aparece ao atingir cada estado critico

### Para o Narrador:
- Os trackers no painel da Coterie mudam de cor e exibem icone de alerta quando um jogador atinge estado critico
- Badge "CRITICO" aparece ao lado do nome do personagem afetado
- Evento automatico e adicionado ao feed quando um jogador fica sem sangue ou vontade

---

## Arquitetura da Solucao

```text
+-------------------------+       +---------------------------+
|   VampireTrackers.tsx   |       | VampireNarratorSidebar.tsx|
|   (Componente Player)   |       |   (Painel Narrador)       |
+-------------------------+       +---------------------------+
           |                                   |
           v                                   v
    [Detecta estado     ]            [Visualiza estados    ]
    [critico localmente ]            [criticos da coterie  ]
           |                                   |
           v                                   |
    [Toast + Banner    ]                       |
    [visual animado    ]                       |
           |                                   |
           +--------> session_events <---------+
                    (tipo: critical_state)
```

---

## Detalhes Tecnicos

### 1. VampireTrackers.tsx - Alertas para o Jogador

**Novas dependencias:**
- Adicionar `AlertTriangle` e `Skull` do lucide-react
- Usar sonner toast para notificacoes mais visiveis

**Logica de deteccao:**
```typescript
const [prevBloodPool, setPrevBloodPool] = useState(initialBloodPool);
const [prevWillpower, setPrevWillpower] = useState(initialWillpower);

// Detectar transicao para estado critico
useEffect(() => {
  if (prevBloodPool > 0 && bloodPool === 0) {
    // Acabou de ficar sem sangue
    emitCriticalEvent('blood_depleted');
    sonnerToast.error('Sangue Esgotado!', {
      description: 'Voce esta em Frenesi de Fome!',
      icon: <Skull />,
      duration: 5000,
    });
  }
  setPrevBloodPool(bloodPool);
}, [bloodPool]);

useEffect(() => {
  if (prevWillpower > 0 && currentWillpower === 0) {
    // Acabou de ficar sem vontade
    emitCriticalEvent('willpower_depleted');
    sonnerToast.error('Vontade Esgotada!', {
      description: 'Voce esta vulneravel a comandos!',
      icon: <AlertTriangle />,
      duration: 5000,
    });
  }
  setPrevWillpower(currentWillpower);
}, [currentWillpower]);
```

**Banner visual animado:**
```typescript
// Dentro do Card de Blood Pool
{bloodPool === 0 && (
  <div className="bg-destructive/20 border border-destructive rounded-lg p-2 
                  animate-pulse flex items-center gap-2">
    <Skull className="w-4 h-4 text-destructive" />
    <span className="text-sm font-medieval text-destructive">
      Frenesi de Fome!
    </span>
  </div>
)}

// Dentro do Card de Willpower
{currentWillpower === 0 && (
  <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-2 
                  animate-pulse flex items-center gap-2">
    <AlertTriangle className="w-4 h-4 text-amber-500" />
    <span className="text-sm font-medieval text-amber-500">
      Vontade Exaurida!
    </span>
  </div>
)}
```

**Emitir evento para o feed:**
```typescript
const emitCriticalEvent = async (type: 'blood_depleted' | 'willpower_depleted') => {
  await supabase.from('session_events').insert({
    session_id: sessionId,
    scene_id: sceneId,
    event_type: 'critical_state',
    event_data: {
      type,
      character_id: character.id,
      character_name: character.name,
    },
  });
};
```

### 2. VampireNarratorSidebar.tsx - Indicadores Visuais

**Logica de estado critico:**
```typescript
const isBloodCritical = bloodPool === 0;
const isWillpowerCritical = currentWillpower === 0;
const hasCriticalState = isBloodCritical || isWillpowerCritical;
```

**Visual do card do jogador:**
```typescript
<div className={`p-2 rounded-lg space-y-2 ${
  hasCriticalState 
    ? 'bg-destructive/20 border border-destructive/40 animate-pulse' 
    : 'bg-muted/30'
}`}>
  {/* Badge de estado critico */}
  {hasCriticalState && (
    <Badge variant="destructive" className="text-xs animate-bounce">
      <AlertTriangle className="w-3 h-3 mr-1" />
      CRITICO
    </Badge>
  )}
  
  {/* Tracker de sangue com cor dinamica */}
  <div className={`... ${
    isBloodCritical ? 'bg-destructive/30 border-destructive' : '...'
  }`}>
    {isBloodCritical && <Skull className="w-3 h-3 text-destructive animate-pulse" />}
  </div>
</div>
```

### 3. VampireEventFeed.tsx - Exibir Eventos Criticos

**Adicionar renderizacao para evento `critical_state`:**
```typescript
case 'critical_state': {
  const { type, character_name } = event.event_data;
  const isBood = type === 'blood_depleted';
  
  return (
    <div className="bg-destructive/20 border border-destructive/40 rounded-lg p-3 animate-pulse">
      <div className="flex items-center gap-2">
        {isBlood ? (
          <Skull className="w-5 h-5 text-destructive" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        )}
        <span className="font-medieval text-destructive">
          {character_name} - {isBlood ? 'Sangue Esgotado!' : 'Vontade Exaurida!'}
        </span>
      </div>
    </div>
  );
}
```

### 4. VampireTrackers - Props Adicionais

Adicionar props para sessionId e sceneId para poder emitir eventos:
```typescript
interface VampireTrackersProps {
  participantId: string;
  sessionId: string;     // Nova prop
  sceneId: string | null; // Nova prop
  character: {...} | null;
  // ... resto das props
}
```

### 5. VampireSession.tsx - Passar Props

Atualizar a chamada do VampireTrackers para incluir sessionId e sceneId:
```typescript
<VampireTrackers
  participantId={myParticipant.id}
  sessionId={sessionId!}
  sceneId={currentScene?.id || null}
  character={myCharacter}
  // ... outras props
/>
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/session/vampire/VampireTrackers.tsx` | Adicionar logica de deteccao, banners animados, emissao de eventos |
| `src/components/session/vampire/VampireNarratorSidebar.tsx` | Adicionar indicadores visuais para estados criticos |
| `src/components/session/vampire/VampireEventFeed.tsx` | Renderizar eventos do tipo `critical_state` |
| `src/pages/VampireSession.tsx` | Passar sessionId e sceneId para VampireTrackers |
| `src/lib/i18n/translations.ts` | Adicionar traducoes para mensagens de estado critico |

---

## Traducoes a Adicionar

```typescript
vampiro: {
  // ... existentes
  bloodDepleted: 'Sangue Esgotado',
  willpowerDepleted: 'Vontade Exaurida',
  hungerFrenzy: 'Frenesi de Fome!',
  vulnerableToCommands: 'Vulneravel a comandos!',
  criticalState: 'Estado Critico',
}
```

---

## Resultado Esperado

1. Jogador clica para gastar ultimo ponto de sangue
2. Tracker fica vermelho com animacao pulsante
3. Banner "Frenesi de Fome!" aparece no card
4. Toast notification aparece por 5 segundos
5. Evento e adicionado ao feed da sessao
6. Narrador ve o card do jogador pulsar vermelho com badge "CRITICO"
7. Feed mostra "Personagem X - Sangue Esgotado!"

