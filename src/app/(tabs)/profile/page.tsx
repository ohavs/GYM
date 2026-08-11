'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowCounterClockwise,
  Barbell,
  CalendarBlank,
  CloudCheck,
  CloudSlash,
  Database,
  PencilSimple,
  SignOut,
  Storefront,
  Target,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { Field, OptionCard, Pill, Slider, Switch } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { SignInSheet } from '@/components/account/sign-in-sheet';
import { useAccount, useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { buildProgram, GOAL_LABEL, LEVEL_LABEL, PLACE_LABEL } from '@/lib/program';
import { seedTrainees } from '@/lib/demo';
import { initials } from '@/lib/format';
import { signOut } from '@/lib/firebase';
import { deleteRemoteData } from '@/lib/sync';
import { useToast } from '@/components/ui/toast';
import type { Goal, Level, Place } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { exercises, meta } = useReadyCatalog();
  const { user, status } = useAccount();

  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
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
  const [signInOpen, setSignInOpen] = useState(false);

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

      <Rise>
        <section className="mb-4 rounded-[var(--radius-lg)] bg-ink p-6 text-white">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/12 text-[20px] font-semibold">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" className="size-full object-cover" />
              ) : (
                initials(profile.name || 'מ')
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[22px]">{profile.name || 'מתאמן'}</h2>
              <p className="mt-1 truncate text-[13px] text-white/50">
                {user?.email ?? 'מצב אורח, נשמר במכשיר הזה'}
              </p>
            </div>
            <IconButton
              label="עריכת השם"
              tone="bare"
              size="sm"
              className="bg-white/12 text-white"
              onClick={() => {
                setDraftName(profile.name);
                setEditing('name');
              }}
            >
              <PencilSimple size={16} weight="bold" />
            </IconButton>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/12 px-3.5 py-2 text-[12.5px]">
              {GOAL_LABEL[profile.goal]}
            </span>
            <span className="rounded-full bg-white/12 px-3.5 py-2 text-[12.5px]">
              {LEVEL_LABEL[profile.level]}
            </span>
            <span className="num rounded-full bg-white/12 px-3.5 py-2 text-[12.5px]">
              {profile.days} בשבוע
            </span>
          </div>
        </section>
      </Rise>

      <Rise>
        <section className="mb-8">
          {user ? (
            <div className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-mint p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/60">
                {status === 'offline' ? (
                  <CloudSlash size={19} weight="fill" />
                ) : (
                  <CloudCheck size={19} weight="fill" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">
                  {status === 'offline'
                    ? 'אין חיבור כרגע'
                    : status === 'loading'
                      ? 'מסנכרן...'
                      : 'מסונכרן לענן'}
                </p>
                <p className="text-[12.5px] text-ink/55">
                  {status === 'offline'
                    ? 'העדכונים יישלחו כשהרשת תחזור'
                    : 'הנתונים נשמרים בחשבון שלכם'}
                </p>
              </div>
              <Button
                size="sm"
                variant="card"
                onClick={async () => {
                  await signOut();
                  toast({ text: 'התנתקתם', detail: 'הנתונים נשארו בענן', tone: 'info' });
                }}
              >
                <SignOut size={15} weight="bold" className="flip-rtl" />
                יציאה
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="flex w-full items-center gap-4 rounded-[var(--radius-lg)] bg-peach p-5 text-start"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/60">
                <CloudCheck size={19} weight="fill" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">שמרו את ההתקדמות</span>
                <span className="block text-[12.5px] text-ink/55">
                  התחברות עם גוגל, סנכרון בין מכשירים
                </span>
              </span>
              <Pill tone="ink">התחברות</Pill>
            </button>
          )}
        </section>
      </Rise>

      <Rise>
        <SectionTitle>מרחב מאמנים</SectionTitle>
        <div className="mb-8 flex items-center gap-4 rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-soft)]">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky">
            <UsersThree size={19} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-medium">מצב מאמן</p>
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
      </Rise>

      <Rise>
        <SectionTitle>הגדרות האימון</SectionTitle>
        <ul className="mb-8 flex flex-col gap-2.5">
          <SettingRow
            icon={<Target size={18} weight="bold" />}
            tint="bg-mint"
            label="מטרה"
            value={GOAL_LABEL[profile.goal]}
            onClick={() => setEditing('goal')}
          />
          <SettingRow
            icon={<Barbell size={18} weight="bold" />}
            tint="bg-lilac"
            label="רמת ניסיון"
            value={LEVEL_LABEL[profile.level]}
            onClick={() => setEditing('level')}
          />
          <SettingRow
            icon={<CalendarBlank size={18} weight="bold" />}
            tint="bg-butter"
            label="אימונים בשבוע"
            value={String(profile.days)}
            onClick={() => setEditing('days')}
          />
          <SettingRow
            icon={<Storefront size={18} weight="bold" />}
            tint="bg-peach"
            label="ציוד זמין"
            value={PLACE_LABEL[profile.place]}
            onClick={() => setEditing('place')}
          />
        </ul>
      </Rise>

      <Rise>
        <SectionTitle>נתונים</SectionTitle>
        <div className="mb-8 flex flex-col gap-3">
          <Button
            variant="card"
            size="lg"
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
            <Database size={17} weight="bold" />
            טעינת נתוני הדגמה
          </Button>
          <Button variant="danger" size="lg" block onClick={() => setConfirmReset(true)}>
            <ArrowCounterClockwise size={17} weight="bold" />
            איפוס כל הנתונים
          </Button>
          <p className="num px-2 text-[12.5px] leading-relaxed text-faint">
            {user
              ? 'הנתונים נשמרים בחשבון גוגל שלכם ומסונכרנים בין מכשירים.'
              : 'הנתונים נשמרים מקומית בדפדפן הזה בלבד.'}{' '}
            {logs.length > 0 && `נרשמו עד כה ${logs.length} אימונים.`}
          </p>
        </div>
      </Rise>

      <Rise>
        <footer className="mb-2 rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[12.5px] font-medium text-muted">קרדיטים</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-faint">
            נתוני התרגילים מגיעים ממאגר exercises-dataset ברישיון MIT. ההדגמות המונפשות והתמונות
            הן רכושה של Gym visual ומוצגות עם ייחוס.
          </p>
          <p className="mt-2 text-[12px] text-faint" dir="ltr">
            {meta.attribution}
          </p>
        </footer>
      </Rise>

      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />

      <Sheet
        open={editing === 'name'}
        onClose={() => setEditing(null)}
        title="השם שלך"
        footer={
          <Button
            block
            size="lg"
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
        <div className="flex flex-col gap-3 py-2">
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
        <div className="flex flex-col gap-3 py-2">
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
          <Button block size="lg" onClick={() => applyAndRebuild({ days: profile.days })}>
            עדכון המסלול
          </Button>
        }
      >
        <div className="rounded-[var(--radius-lg)] bg-card p-6 shadow-[var(--shadow-soft)]">
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
        <div className="flex flex-col gap-3 py-2">
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
          <div className="flex gap-3">
            <Button variant="card" size="lg" className="flex-1" onClick={() => setConfirmReset(false)}>
              ביטול
            </Button>
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={async () => {
                if (user) await deleteRemoteData(user.uid).catch(() => {});
                resetAll();
                router.replace('/welcome');
              }}
            >
              מחיקה
            </Button>
          </div>
        }
      >
        <p className="px-1 py-2 text-[15px] leading-relaxed text-muted">
          {user
            ? 'הנתונים יימחקו גם מהחשבון בענן. לא ניתן לשחזר.'
            : 'לא ניתן לשחזר את הנתונים אחרי המחיקה.'}
        </p>
      </Sheet>
    </Screen>
  );
}

function SettingRow({
  icon,
  tint,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-[var(--radius-md)] bg-card p-3.5 pe-5 text-start shadow-[var(--shadow-soft)]"
      >
        <span className={`grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] ${tint}`}>
          {icon}
        </span>
        <span className="flex-1 text-[15.5px] font-medium">{label}</span>
        <span className="truncate text-[14px] text-muted">{value}</span>
        <PencilSimple size={15} weight="bold" className="shrink-0 text-faint" />
      </button>
    </li>
  );
}
