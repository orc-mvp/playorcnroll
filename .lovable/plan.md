

## Plan: Add "Dados" (Raw Dice) Test Type to Both Vampire and Werewolf Test Modals

### Overview
Add a new "Dados" test type to **both** `VampireTestRequestModal` and `WerewolfTestRequestModal`. When selected, the narrator specifies a fixed number of dice and difficulty — no attribute/ability selection needed. The player receives the exact dice count specified.

### Changes

**1. Types (`src/lib/vampiro/diceUtils.ts` + `src/lib/lobisomem/diceUtils.ts`)**
- Add `'raw_dice'` to `TestType` (vampire) and `WerewolfTestType` (werewolf)

**2. i18n (`src/lib/i18n/translations.ts`)**
- Add keys: `rawDice` ("Dados" / "Dice"), `rawDicePool` ("Quantidade de dados" / "Dice count")

**3. `VampireTestRequestModal.tsx`**
- Add `'raw_dice'` to `TEST_TYPES` array
- Add `diceCount` state (default 1, range 1–20)
- Add `diceCount` to `TestConfig` interface (optional)
- When `testType === 'raw_dice'`: hide attribute/ability/virtue grids, show dice count selector with +/- buttons (same pattern as difficulty)
- Difficulty selector remains visible
- Validation: only needs players selected

**4. `WerewolfTestRequestModal.tsx`**
- Same changes as vampire modal, adapted to `WerewolfTestConfig`

**5. `VampirePendingTest.tsx`**
- In `calculatePool()`: for `raw_dice`, return `config.diceCount` directly
- In `getTestLabel()`: return localized "X Dados" label

**6. `MobilePendingTestDrawer.tsx`**
- Update `TestConfig` interface to include optional `diceCount`

