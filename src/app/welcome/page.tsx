'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Barbell,
  CaretLeft,
  Check,
  Fire,
  Heart,
  House,
  Lightning,
  Medal,
  Sparkle,
  Storefront,
  Sun,
} from '@phosphor-icons/react/dist/ssr';
import { Button, IconButton } from '@/components/ui/button';
import { Field, OptionCard, Slider, TINT_BG, TINT_DEEP, type Tint } from '@/components/ui/controls';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { useCatalog } from '@/components/app-providers';
import { useHydrated, useStore } from '@/lib/store';
import { buildProgram, GOAL_LABEL } from '@/lib/program';
import type { BodyPartKey, Goal, Level, Place } from '@/lib/types';
import { haptic } from '@/lib/haptics';

const GOALS: { value: Goal; title: string; description: string; icon: React.ReactNode; tint: 'peach' | 'mint' | 'lilac' | 'butter' }[] = [
  { value: 'muscle', title: GOAL_LABEL.muscle, description: 'משקל בינוני, 8 עד 12 חזרות', icon: <Barbell size={21} weight="bold" />, tint: 'peach' },
  { value: 'strength', title: GOAL_LABEL.strength, description: 'משקלים כבדים, מעט חזרות', icon: <Medal size={21} weight="bold" />, tint: 'lilac' },
  { value: 'fat', title: GOAL_LABEL.fat, description: 'חזרות גבוהות, מנוחות קצרות', icon: <Fire size={21} weight="bold" />, tint: 'butter' },
  { value: 'health', title: GOAL_LABEL.health, description: 'אימון מאוזן ונוח לשגרה', icon: <Heart size={21} weight="bold" />, tint: 'mint' },
];

const LEVELS: { value: Level; title: string; description: string; icon: React.ReactNode; tint: 'peach' | 'mint' | 'lilac' }[] = [
  { value: 1, title: 'מתחיל', description: 'עד חצי שנה של אימוני התנגדות', icon: <Sun size={21} weight="bold" />, tint: 'butter' as never },
  { value: 2, title: 'בינוני', description: 'מתאמן בקביעות, מכיר את התרגילים', icon: <Lightning size={21} weight="bold" />, tint: 'mint' },
  { value: 3, title: 'מתקדם', description: 'שנתיים ומעלה, טכניקה טובה', icon: <Sparkle size={21} weight="bold" />, tint: 'lilac' },
];

const PLACES: { value: Place; title: string; description: string; icon: React.ReactNode }[] = [
  { value: 'gym', title: 'חדר כושר', description: 'מכונות, מוטות, כבלים והכל', icon: <Storefront size={21} weight="bold" /> },
  { value: 'home', title: 'בית מאובזר', description: 'משקולות יד, גומיות, קטלבל', icon: <House size={21} weight="bold" /> },
  { value: 'minimal', title: 'מינימלי', description: 'משקל גוף וזוג משקולות', icon: <Barbell size={21} weight="bold" /> },
];

const FOCUS: { value: BodyPartKey; label: string; tint: Tint }[] = [
  { value: 'chest', label: 'חזה', tint: 'peach' },
  { value: 'back', label: 'גב', tint: 'mint' },
  { value: 'shoulders', label: 'כתפיים', tint: 'lilac' },
  { value: 'upper arms', label: 'זרועות', tint: 'butter' },
  { value: 'upper legs', label: 'רגליים', tint: 'sky' },
  { value: 'waist', label: 'בטן וליבה', tint: 'blush' },
];

const STEPS = ['שם', 'מטרה', 'ניסיון', 'תדירות', 'ציוד', 'דגשים'] as const;

export default function WelcomePage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const { exercises, meta, ready } = useCatalog();
  const setProfile = useStore((s) => s.setProfile);
  const setProgram = useStore((s) => s.setProgram);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('muscle');
  const [level, setLevel] = useState<Level>(1);
  const [days, setDays] = useState(3);
  const [place, setPlace] = useState<Place>('gym');
  const [focus, setFocus] = useState<BodyPartKey[]>([]);
  const [building, setBuilding] = useState(false);

  const canContinue = step !== 0 || name.trim().length >= 2;

  const focusArt = useMemo(() => {
    const map = new Map<string, (typeof exercises)[number]>();
    for (const option of FOCUS) {
      const best = exercises
        .filter((ex) => ex.bp === option.value)
        .sort((a, b) => b.rank - a.rank)[0];
      if (best) map.set(option.value, best);
    }
    return map;
  }, [exercises]);

  const go = (delta: number) => {
    setDirection(delta);
    setStep((s) => s + delta);
  };

  const finish = () => {
    if (!meta || !ready) return;
    haptic('success');
    setBuilding(true);
    const program = buildProgram({ goal, level, days, place, focus, exercises, meta });
    setProfile({ name: name.trim(), goal, level, days, place, focus, onboarded: true });
    setProgram(program);
    setTimeout(() => router.replace('/'), reduce ? 0 : 1400);
  };

  const variants = useMemo(
    () => ({
      enter: (dir: number) => (reduce ? { opacity: 0 } : { x: dir * 44, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (dir: number) => (reduce ? { opacity: 0 } : { x: dir * -44, opacity: 0 }),
    }),
    [reduce],
  );

  if (!hydrated) return null;
  if (building) return <BuildingScreen name={name.trim()} />;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-5 safe-t">
      <header className="flex items-center gap-3 pt-5 pb-8">
        {step > 0 ? (
          <IconButton label="שלב קודם" onClick={() => go(-1)}>
            <CaretLeft size={19} weight="bold" className="flip-rtl" />
          </IconButton>
        ) : (
          <span className="size-12" />
        )}
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((label, i) => (
            <motion.span
              key={label}
              initial={false}
              animate={{ opacity: i <= step ? 1 : 0.35 }}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-line-strong'}`}
            />
          ))}
        </div>
        <span className="digits w-12 text-end text-[13px] text-faint">
          {step + 1}/{STEPS.length}
        </span>
      </header>

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-7"
          >
            {step === 0 && (
              <StepShell
                title="נעים להכיר"
                body="נבנה יחד מסלול אימונים שמתאים בדיוק לך. שש שאלות קצרות, פחות מדקה."
              >
                <Field
                  label="איך לקרוא לך?"
                  value={name}
                  onChange={setName}
                  placeholder="השם הפרטי שלך"
                  maxLength={24}
                  autoFocus
                  hint="נשתמש בזה רק בתוך האפליקציה."
                />
              </StepShell>
            )}

            {step === 1 && (
              <StepShell
                title="מה המטרה?"
                body="המטרה קובעת כמה סטים, כמה חזרות וכמה מנוחה בין הסטים."
              >
                <div className="flex flex-col gap-3">
                  {GOALS.map((option) => (
                    <OptionCard
                      key={option.value}
                      selected={goal === option.value}
                      onSelect={() => setGoal(option.value)}
                      title={option.title}
                      description={option.description}
                      icon={option.icon}
                      tint={option.tint}
                    />
                  ))}
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell
                title="כמה ניסיון יש לך?"
                body="לפי זה נחליט אילו תרגילים להכניס ובאיזו מורכבות."
              >
                <div className="flex flex-col gap-3">
                  {LEVELS.map((option) => (
                    <OptionCard
                      key={option.value}
                      selected={level === option.value}
                      onSelect={() => setLevel(option.value)}
                      title={option.title}
                      description={option.description}
                      icon={option.icon}
                      tint={option.tint}
                    />
                  ))}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell
                title="כמה פעמים בשבוע?"
                body="עדיף להתחייב למספר שאפשר לעמוד בו לאורך זמן."
              >
                <div className="rounded-[var(--radius-lg)] bg-card p-6 shadow-[var(--shadow-soft)]">
                  <Slider label="אימונים בשבוע" value={days} min={2} max={6} onChange={setDays} />
                </div>
                <p className="rounded-[var(--radius-lg)] bg-mint px-5 py-4 text-[14px] leading-relaxed">
                  {days <= 2 && 'שני אימוני גוף מלא בשבוע. מספיק לשמור ולהתקדם לאט.'}
                  {days === 3 &&
                    (level === 1
                      ? 'שלושה אימוני גוף מלא. החלוקה הכי יעילה למתחילים.'
                      : 'דחיפה, משיכה ורגליים. חלוקה קלאסית שמכסה הכל.')}
                  {days === 4 && 'עליון ותחתון פעמיים בשבוע. איזון טוב בין עבודה למנוחה.'}
                  {days === 5 && 'חמישה אימונים משולבים. דורש שגרה יציבה.'}
                  {days === 6 && 'דחיפה משיכה רגליים פעמיים. הרבה עבודה, שימו לב לשינה.'}
                </p>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="איפה אתם מתאמנים?"
                body="נסנן את מאגר התרגילים לפי הציוד שזמין לכם בפועל."
              >
                <div className="flex flex-col gap-3">
                  {PLACES.map((option) => (
                    <OptionCard
                      key={option.value}
                      selected={place === option.value}
                      onSelect={() => setPlace(option.value)}
                      title={option.title}
                      description={option.description}
                      icon={option.icon}
                    />
                  ))}
                </div>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="יש משהו שחשוב לכם במיוחד?"
                body="בחירה אופציונלית. הקבוצות שתסמנו יקבלו קצת יותר עבודה בשבוע."
              >
                <div className="grid grid-cols-2 gap-3">
                  {FOCUS.map((option) => {
                    const selected = focus.includes(option.value);
                    const art = focusArt.get(option.value);
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        animate={{ scale: selected ? 1 : 0.985 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                        onClick={() => {
                          haptic('select');
                          setFocus((f) =>
                            f.includes(option.value)
                              ? f.filter((x) => x !== option.value)
                              : [...f, option.value],
                          );
                        }}
                        aria-pressed={selected}
                        className={`relative overflow-hidden rounded-[var(--radius-lg)] text-start transition-colors duration-200 ${
                          selected ? TINT_DEEP[option.tint] : TINT_BG[option.tint]
                        }`}
                      >
                        {/* Selection deepens the same colour instead of turning
                            the tile black, so the grid keeps reading as one set. */}
                        <span
                          className={`pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border-2 transition-colors duration-200 ${
                            selected ? 'border-ink' : 'border-transparent'
                          }`}
                        />
                        {art && (
                          <span className="block h-28 w-full">
                            <ExerciseMedia exercise={art} plain className="size-full" />
                          </span>
                        )}
                        <span className="flex items-center justify-between gap-2 px-4 pb-4 pt-1">
                          <span className="text-[19px] font-medium">{option.label}</span>
                          <motion.span
                            initial={false}
                            animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0 }}
                            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                            className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-white"
                          >
                            <Check size={14} weight="bold" />
                          </motion.span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 bg-canvas pt-5 pb-[max(env(safe-area-inset-bottom),22px)]">
        {step < STEPS.length - 1 ? (
          <Button block size="lg" disabled={!canContinue} onClick={() => go(1)}>
            המשך
          </Button>
        ) : (
          <Button block size="lg" onClick={finish} disabled={!ready}>
            בנו לי את המסלול
          </Button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div>
        <h1 className="text-[34px] leading-[1.06]">{title}</h1>
        <p className="mt-3 max-w-[34ch] text-[15.5px] leading-relaxed text-muted">{body}</p>
      </div>
      {children}
    </>
  );
}

function BuildingScreen({ name }: { name: string }) {
  const lines = ['מסננים תרגילים לפי הציוד שלך', 'מסדרים את השבוע', 'קובעים סטים וחזרות'];
  return (
    <div className="grid min-h-[100dvh] place-items-center px-8 text-center">
      <div className="flex flex-col items-center gap-8">
        <motion.span
          className="grid size-24 place-items-center rounded-full bg-ink text-white"
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Barbell size={38} weight="bold" />
        </motion.span>
        <div>
          <h1 className="text-[28px]">בונים את המסלול{name ? ` של ${name}` : ''}</h1>
          <ul className="mt-6 flex flex-col gap-2.5">
            {lines.map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.32 }}
                className="text-[15px] text-muted"
              >
                {line}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
