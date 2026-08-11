'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowCounterClockwise,
  Barbell,
  Copyright,
  Database,
  Moon,
  PencilSimple,
  Storefront,
  Sun,
  Target,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr';
import { Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Field, OptionCard, Segmented, Slider, Switch } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { useStore, type ThemeChoice } from '@/lib/store';
import { buildProgram, GOAL_LABEL, LEVEL_LABEL, PLACE_LABEL } from '@/lib/program';
import { seedTrainees } from '@/lib/demo';
import { avatarHue, initials } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import type { Goal, Level, Place } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { exercises, meta } = useReadyCatalog();

  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const program = useStore((s) => s.program);
  const setProgram = useStore((s) => s.setProgram);
  const logs = useStore((s) => s.logs);
  const trainees = useStore((s) => s.trainees);
  const upsertTrainee = useStore((s) => s.upsertTrainee);
  const seedDemoHistory = useStore((s) => s.seedDemoHistory);
  const resetAll = useStore((s) => s.resetAll);

  const [editing, setEditing] = useState<null | 'name' | 'goal' | 'level' | 'days' | 'place'>(null);
  const [draftName, setDraftName] = useState(profile.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const hue = avatarHue(profile.name || 'מסלול');

  const applyAndRebuild = (patch: Partial<typeof profile>) => {
    const next = { ...profile, ...patch };
    setProfile(patch);
    if (program?.source === 'auto') {
      setProgram(buildProgram({ ...next, exercises, meta }));
      toast({ text: 'עדכנו את המסלול', detail: 'התוכנית נבנתה מחדש לפי השינוי', tone: 'ok' });
    }
    setEditing(null);
  };

  return (
    <Screen>
      <ScreenHeader title="הפרופיל שלי" />

      <section className="card mb-5 flex items-center gap-4 p-5">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-3xl text-[20px] font-bold text-white"
          style={{ background: `linear-gradient(140deg, hsl(${hue} 46% 42%), hsl(${hue + 14} 42% 27%))` }}
        >
          {initials(profile.name || 'מ')}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[20px]">{profile.name || 'מתאמן'}</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {GOAL_LABEL[profile.goal]} · {LEVEL_LABEL[profile.level]}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setDraftName(profile.name);
            setEditing('name');
          }}
        >
          <PencilSimple size={15} weight="bold" />
          עריכה
        </Button>
      </section>

      <SectionTitle>הגדרות האימון</SectionTitle>
      <ul className="mb-6 divide-y divide-line-soft overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <SettingRow
          icon={<Target size={17} weight="bold" />}
          label="מטרה"
          value={GOAL_LABEL[profile.goal]}
          onClick={() => setEditing('goal')}
        />
        <SettingRow
          icon={<Barbell size={17} weight="bold" />}
          label="רמת ניסיון"
          value={LEVEL_LABEL[profile.level]}
          onClick={() => setEditing('level')}
        />
        <SettingRow
          icon={<Barbell size={17} weight="bold" />}
          label="אימונים בשבוע"
          value={String(profile.days)}
          onClick={() => setEditing('days')}
        />
        <SettingRow
          icon={<Storefront size={17} weight="bold" />}
          label="ציוד זמין"
          value={PLACE_LABEL[profile.place]}
          onClick={() => setEditing('place')}
        />
      </ul>

      <SectionTitle>מרחב מאמנים</SectionTitle>
      <div className="mb-6 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-wash text-accent">
            <UsersThree size={18} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">מצב מאמן</p>
            <p className="text-[13px] text-muted">ניהול מתאמנים ובניית תוכניות עבורם</p>
          </div>
          <Switch
            label="מצב מאמן"
            checked={profile.role === 'coach'}
            onChange={(next) => {
              setProfile({ role: next ? 'coach' : 'trainee' });
              if (next && trainees.length === 0) {
                seedTrainees(exercises, meta).forEach(upsertTrainee);
                toast({ text: 'מצב מאמן הופעל', detail: 'הוספנו מתאמני הדגמה', tone: 'ok' });
              }
              if (next) router.push('/coach');
            }}
          />
        </div>
      </div>

      <SectionTitle>תצוגה</SectionTitle>
      <div className="mb-6 card p-4">
        <Segmented<ThemeChoice>
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'כהה' },
            { value: 'light', label: 'בהיר' },
            { value: 'system', label: 'לפי המכשיר' },
          ]}
        />
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted">
          {theme === 'light' ? <Sun size={14} weight="fill" /> : <Moon size={14} weight="fill" />}
          המצב הכהה הוא ברירת המחדל. נוח יותר לאימון ערב.
        </p>
      </div>

      <SectionTitle>נתונים</SectionTitle>
      <div className="mb-6 flex flex-col gap-2.5">
        <Button
          variant="secondary"
          block
          onClick={() => {
            if (!program) {
              toast({ text: 'צריך מסלול פעיל קודם', tone: 'warn' });
              return;
            }
            seedDemoHistory(program, new Map(exercises.map((ex) => [ex.id, ex])));
            toast({ text: 'נטענה היסטוריית הדגמה', detail: 'שישה שבועות של אימונים', tone: 'ok' });
          }}
        >
          <Database size={16} weight="bold" />
          טעינת נתוני הדגמה
        </Button>
        <Button variant="danger" block onClick={() => setConfirmReset(true)}>
          <ArrowCounterClockwise size={16} weight="bold" />
          איפוס כל הנתונים
        </Button>
        <p className="px-1 text-[12px] leading-relaxed text-faint">
          הנתונים נשמרים מקומית בדפדפן הזה בלבד. אין שרת ואין חשבון.{' '}
          {logs.length > 0 && (
            <>
              נרשמו עד כה <span className="num">{logs.length}</span> אימונים.
            </>
          )}
        </p>
      </div>

      <footer className="mb-2 rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <Copyright size={14} />
          קרדיטים
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-faint">
          נתוני התרגילים מגיעים ממאגר exercises-dataset ברישיון MIT. ההדגמות המונפשות והתמונות
          הן רכושה של Gym visual ומוצגות עם ייחוס.
        </p>
        <p className="mt-1.5 text-[12px] text-faint" dir="ltr">
          {meta.attribution}
        </p>
      </footer>

      {/* Editors */}
      <Sheet
        open={editing === 'name'}
        onClose={() => setEditing(null)}
        title="השם שלך"
        footer={
          <Button
            block
            disabled={draftName.trim().length < 2}
            onClick={() => {
              setProfile({ name: draftName.trim() });
              setEditing(null);
              toast({ text: 'השם עודכן', tone: 'ok' });
            }}
          >
            שמירה
          </Button>
        }
      >
        <div className="py-2">
          <Field label="שם" value={draftName} onChange={setDraftName} maxLength={24} autoFocus />
        </div>
      </Sheet>

      <Sheet
        open={editing === 'goal'}
        onClose={() => setEditing(null)}
        title="מטרת האימון"
        subtitle="משנה את מספר הסטים, החזרות והמנוחות"
      >
        <div className="flex flex-col gap-2.5 py-2">
          {(Object.keys(GOAL_LABEL) as Goal[]).map((goal) => (
            <OptionCard
              key={goal}
              selected={profile.goal === goal}
              onSelect={() => applyAndRebuild({ goal })}
              title={GOAL_LABEL[goal]}
            />
          ))}
        </div>
      </Sheet>

      <Sheet open={editing === 'level'} onClose={() => setEditing(null)} title="רמת ניסיון">
        <div className="flex flex-col gap-2.5 py-2">
          {([1, 2, 3] as Level[]).map((level) => (
            <OptionCard
              key={level}
              selected={profile.level === level}
              onSelect={() => applyAndRebuild({ level })}
              title={LEVEL_LABEL[level]}
            />
          ))}
        </div>
      </Sheet>

      <Sheet
        open={editing === 'days'}
        onClose={() => setEditing(null)}
        title="אימונים בשבוע"
        footer={
          <Button block onClick={() => applyAndRebuild({ days: profile.days })}>
            עדכון המסלול
          </Button>
        }
      >
        <div className="py-4">
          <Slider
            label="אימונים בשבוע"
            value={profile.days}
            min={2}
            max={6}
            onChange={(days) => setProfile({ days })}
          />
        </div>
      </Sheet>

      <Sheet open={editing === 'place'} onClose={() => setEditing(null)} title="ציוד זמין">
        <div className="flex flex-col gap-2.5 py-2">
          {(Object.keys(PLACE_LABEL) as Place[]).map((place) => (
            <OptionCard
              key={place}
              selected={profile.place === place}
              onSelect={() => applyAndRebuild({ place })}
              title={PLACE_LABEL[place]}
            />
          ))}
        </div>
      </Sheet>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="לאפס הכל?"
        subtitle="הפעולה מוחקת את הפרופיל, המסלול וההיסטוריה"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>
              ביטול
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                resetAll();
                router.replace('/welcome');
              }}
            >
              מחיקה
            </Button>
          </div>
        }
      >
        <p className="py-2 text-[14px] leading-relaxed text-muted">
          לא ניתן לשחזר את הנתונים אחרי המחיקה. תוחזרו למסך ההרשמה כדי לבנות מסלול חדש.
        </p>
      </Sheet>
    </Screen>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-start">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
          {icon}
        </span>
        <span className="flex-1 text-[15px] font-semibold">{label}</span>
        <span className="truncate text-[14px] text-muted">{value}</span>
        <PencilSimple size={14} weight="bold" className="shrink-0 text-faint" />
      </button>
    </li>
  );
}
