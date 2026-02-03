import { useState, useCallback, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DiceScene } from './DiceScene';
import { checkExtremes, calculateResult, getAttributeModifier, type AttributeType, type TestResult } from '@/lib/dice/extremeTable';
import { Dices, Sparkles, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiceRollerProps {
  attribute: string;
  attributeType: AttributeType;
  difficulty: number;
  onRollComplete: (result: {
    dice1: number;
    dice2: number;
    total: number;
    result: TestResult;
    hasPositiveExtreme: boolean;
    hasNegativeExtreme: boolean;
  }) => void;
  disabled?: boolean;
}

export function DiceRoller({ 
  attribute, 
  attributeType, 
  difficulty, 
  onRollComplete,
  disabled = false 
}: DiceRollerProps) {
  const { t } = useI18n();
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [rollResult, setRollResult] = useState<{
    total: number;
    result: TestResult;
    hasPositiveExtreme: boolean;
    hasNegativeExtreme: boolean;
  } | null>(null);

  const rollDice = useCallback(() => {
    if (isRolling || disabled) return;

    setIsRolling(true);
    setHasRolled(false);
    setRollResult(null);

    // Generate random values
    const newDice1 = Math.floor(Math.random() * 6) + 1;
    const newDice2 = Math.floor(Math.random() * 6) + 1;

    // Calculate after animation
    setTimeout(() => {
      setDice1(newDice1);
      setDice2(newDice2);
      setIsRolling(false);
    }, 2500);
  }, [isRolling, disabled]);

  const handleRollComplete = useCallback(() => {
    if (hasRolled) return;
    
    const attrModifier = getAttributeModifier(attributeType);
    const total = dice1 + dice2 + attrModifier - difficulty;
    const extremes = checkExtremes(dice1, dice2, attributeType);
    const result = calculateResult(total);

    const resultData = {
      dice1,
      dice2,
      total,
      result,
      hasPositiveExtreme: extremes.positive,
      hasNegativeExtreme: extremes.negative,
    };

    setRollResult(resultData);
    setHasRolled(true);
    onRollComplete(resultData);
  }, [dice1, dice2, attributeType, difficulty, hasRolled, onRollComplete]);

  const getResultIcon = (result: TestResult) => {
    switch (result) {
      case 'success': return <CheckCircle className="w-6 h-6" />;
      case 'partial': return <MinusCircle className="w-6 h-6" />;
      case 'failure': return <XCircle className="w-6 h-6" />;
    }
  };

  const getResultColor = (result: TestResult) => {
    switch (result) {
      case 'success': return 'text-green-500';
      case 'partial': return 'text-yellow-500';
      case 'failure': return 'text-red-500';
    }
  };

  return (
    <Card className={cn(
      "medieval-card overflow-hidden transition-all duration-500",
      rollResult?.hasPositiveExtreme && "ring-2 ring-yellow-500 animate-pulse",
      rollResult?.hasNegativeExtreme && "ring-2 ring-red-500 animate-pulse"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Attribute Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-body">{t.tests.selectAttribute}</p>
            <p className="font-medieval text-lg">{t.attributes[attribute as keyof typeof t.attributes]}</p>
          </div>
          <Badge variant="outline" className={cn(
            attributeType === 'strong' && 'bg-green-500/20 text-green-500 border-green-500/30',
            attributeType === 'neutral' && 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
            attributeType === 'weak' && 'bg-red-500/20 text-red-500 border-red-500/30',
          )}>
            {t.attributes[attributeType]}
          </Badge>
        </div>

        {/* 3D Dice Scene */}
        <div className="bg-black/20 rounded-lg overflow-hidden">
          <DiceScene 
            dice1={dice1} 
            dice2={dice2} 
            isRolling={isRolling}
            onRollComplete={handleRollComplete}
          />
        </div>

        {/* Roll Button or Result */}
        {!hasRolled ? (
          <Button 
            className="w-full font-medieval text-lg py-6" 
            onClick={rollDice}
            disabled={isRolling || disabled}
          >
            <Dices className="w-5 h-5 mr-2" />
            {isRolling ? t.tests.rolling : t.tests.roll}
          </Button>
        ) : rollResult && (
          <div className="space-y-3">
            {/* Dice Values */}
            <div className="flex items-center justify-center gap-4 text-2xl font-medieval">
              <span className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg">
                {dice1}
              </span>
              <span className="text-muted-foreground">+</span>
              <span className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg">
                {dice2}
              </span>
              <span className="text-muted-foreground">=</span>
              <span className="text-primary">{dice1 + dice2}</span>
            </div>

            {/* Modifiers */}
            <div className="text-center text-sm text-muted-foreground font-body">
              {dice1 + dice2} + {getAttributeModifier(attributeType)} (attr) - {difficulty} (dif) = {rollResult.total}
            </div>

            {/* Result */}
            <div className={cn(
              "flex items-center justify-center gap-2 text-xl font-medieval",
              getResultColor(rollResult.result)
            )}>
              {getResultIcon(rollResult.result)}
              <span>{t.tests[rollResult.result]}</span>
            </div>

            {/* Extreme Notifications */}
            {rollResult.hasPositiveExtreme && (
              <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="font-medieval text-yellow-500">{t.tests.extremePositive}</span>
              </div>
            )}

            {rollResult.hasNegativeExtreme && (
              <div className="flex items-center justify-center gap-2 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medieval text-red-500">{t.tests.extremeNegative}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
