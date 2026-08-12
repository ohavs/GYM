'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, Link as LinkIcon, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { SignInSheet } from '@/components/account/sign-in-sheet';
import { useAccount, useLinksContext } from '@/components/app-providers';
import { useNavigation } from '@/components/layout/navigation';
import { useStore } from '@/lib/store';
import { findInvite, requestLink, type Invite } from '@/lib/links';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';
import { initials } from '@/lib/format';

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <Join />
    </Suspense>
  );
}

type Step = 'code' | 'confirm' | 'sent';

/**
 * The code, set exactly as the coach sees it on their side — same size, same
 * tracking, same monospaced figures. The two halves of one handshake should
 * look like the same object.
 */
function CodeField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor="join-code" className="px-1 text-[14px] font-medium text-ink-soft">
        קוד המאמן
      </label>
      <input
        id="join-code"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
        placeholder="······"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="go"
        aria-invalid={Boolean(error)}
        className={`digits h-[76px] w-full rounded-[var(--radius-lg)] bg-card text-center text-[30px] font-semibold tracking-[0.16em] text-ink shadow-[var(--shadow-soft)] outline-none transition-shadow placeholder:text-faint focus:shadow-[var(--shadow-pop)] ${
          error ? 'ring-2 ring-red' : ''
        }`}
      />
      {error && <p className="px-1 text-[13px] text-red">{error}</p>}
    </div>
  );
}

function Join() {
  const params = useSearchParams();
  const nav = useNavigation();
  const toast = useToast();
  const { user } = useAccount();
  const links = useLinksContext();
  const profile = useStore((s) => s.profile);

  const [code, setCode] = useState(params.get('code')?.toUpperCase() ?? '');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [step, setStep] = useState<Step>('code');
  // A code in the address means a lookup is already under way on first paint.
  const [busy, setBusy] = useState(Boolean(params.get('code')));
  const [error, setError] = useState<string | undefined>();
  const [signInOpen, setSignInOpen] = useState(false);

  // A code in the address means the link was shared, not typed: look it up
  // straight away so the first thing on screen is the coach's name.
  useEffect(() => {
    const fromUrl = params.get('code');
    if (!fromUrl) return;
    let alive = true;
    findInvite(fromUrl)
      .then((found) => {
        if (!alive) return;
        if (found) {
          setInvite(found);
          setStep('confirm');
        } else {
          setError('הקוד לא נמצא. אפשר להקליד אותו ידנית.');
        }
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [params]);

  // Already connected to this coach — say so instead of asking again.
  const already = invite && links.asTrainee.find((l) => l.coachUid === invite.coachUid);

  const lookUp = async () => {
    setError(undefined);
    setBusy(true);
    const found = await findInvite(code);
    setBusy(false);
    if (!found) {
      haptic('warn');
      setError('לא מצאנו מאמן עם הקוד הזה');
      return;
    }
    haptic('select');
    setInvite(found);
    setStep('confirm');
  };

  const join = async () => {
    if (!invite) return;
    if (!user) {
      setSignInOpen(true);
      return;
    }
    setBusy(true);
    try {
      await requestLink(invite, user.uid, {
        traineeName: profile.name || user.displayName?.split(' ')[0] || 'מתאמן',
        traineeGoal: profile.goal,
        traineeLevel: profile.level,
        traineeDays: profile.days,
        traineePlace: profile.place,
      });
      haptic('success');
      setStep('sent');
    } catch {
      haptic('warn');
      toast({ text: 'לא הצלחנו לשלוח את הבקשה', detail: 'בדקו את החיבור ונסו שוב', tone: 'warn' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="pb-16">
      <Rise>
        <header className="pt-10 pb-8 text-center">
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 grid size-20 place-items-center rounded-[var(--radius-lg)] bg-lilac"
          >
            <UsersThree size={34} weight="fill" />
          </motion.span>
          <h1 className="text-[30px] leading-[1.1]">
            {step === 'sent' ? 'הבקשה נשלחה' : 'הצטרפות למאמן'}
          </h1>
          <p className="mx-auto mt-3 max-w-[30ch] text-[15px] leading-relaxed text-muted">
            {step === 'code' && 'הזינו את הקוד שקיבלתם מהמאמן, והמסלול שלו יגיע לאפליקציה שלכם.'}
            {step === 'confirm' && 'בדקו שזה המאמן הנכון לפני ששולחים.'}
            {step === 'sent' && 'ברגע שהמאמן יאשר, המסלול שלו יופיע כאן. אפשר להמשיך להתאמן בינתיים.'}
          </p>
        </header>
      </Rise>

      {step === 'code' && (
        <Rise>
          <div className="flex flex-col gap-4">
            <CodeField
              value={code}
              error={error}
              onChange={(v) => {
                setError(undefined);
                setCode(v);
              }}
            />
            <Button
              block
              size="lg"
              disabled={code.length < 4 || busy}
              onClick={lookUp}
            >
              {busy ? 'מחפשים...' : 'המשך'}
              {!busy && <ArrowRight size={18} weight="bold" className="flip-rtl" />}
            </Button>
          </div>
        </Rise>
      )}

      {step === 'confirm' && invite && (
        <Rise>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-soft)]">
              <span className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-mint text-[17px] font-semibold">
                {initials(invite.coachName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-medium">{invite.coachName}</p>
                <p className="digits mt-0.5 text-[13px] text-muted">קוד {invite.code}</p>
              </div>
            </div>

            <p className="px-1 text-[13.5px] leading-relaxed text-muted">
              המאמן יוכל לראות את האימונים שביצעתם ולבנות לכם מסלול. הוא לא יוכל לשנות
              את הנתונים שלכם, ואפשר לנתק את הקשר בכל רגע מהפרופיל.
            </p>

            {already ? (
              <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-mint p-5">
                <CheckCircle size={22} weight="fill" />
                <p className="text-[14.5px] font-medium">
                  {already.status === 'active' ? 'אתם כבר מחוברים למאמן הזה' : 'כבר שלחתם בקשה למאמן הזה'}
                </p>
              </div>
            ) : (
              <Button block size="lg" disabled={busy} onClick={join}>
                {busy ? 'שולחים...' : user ? 'שליחת בקשה' : 'התחברות ושליחת בקשה'}
              </Button>
            )}

            <Button
              block
              size="lg"
              variant="card"
              onClick={() => {
                setStep('code');
                setInvite(null);
              }}
            >
              קוד אחר
            </Button>
          </div>
        </Rise>
      )}

      {step === 'sent' && (
        <Rise>
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-mint p-5"
            >
              <CheckCircle size={24} weight="fill" />
              <p className="text-[15px] font-medium">ממתין לאישור של {invite?.coachName}</p>
            </motion.div>
            <Button block size="lg" onClick={() => nav.go('/')}>
              חזרה לאימונים
            </Button>
          </div>
        </Rise>
      )}

      {step === 'code' && (
        <Rise>
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-[13px] text-faint">
            <LinkIcon size={14} weight="bold" />
            אין לכם קוד? בקשו מהמאמן שלכם את קישור ההצטרפות.
          </p>
        </Rise>
      )}

      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
    </Screen>
  );
}
