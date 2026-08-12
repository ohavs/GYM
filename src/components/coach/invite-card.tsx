'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowsClockwise, Check, Copy, ShareNetwork } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { ensureInvite, rotateInvite } from '@/lib/links';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';

/**
 * The coach's standing join code, and the one link they hand out.
 *
 * A code rather than a search: without a server there is no way to look
 * somebody up by email, and there should not be — knowing the code is the only
 * way to reach a coach, and the coach still approves every request.
 */
export function InviteCard({ onNeedsAccount }: { onNeedsAccount: () => void }) {
  const toast = useToast();
  const { user } = useAccount();
  const name = useStore((s) => s.profile.name);

  // Stamped with the account, so a sign-out never shows the last coach's code.
  const [issued, setIssued] = useState<{ uid: string; code: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const uid = user.uid;
    ensureInvite(uid, name || user.displayName?.split(' ')[0] || 'המאמן').then((value) => {
      if (alive) setIssued({ uid, code: value });
    });
    return () => {
      alive = false;
    };
  }, [user, name]);

  const code = issued && issued.uid === user?.uid ? issued.code : null;
  const setCode = (next: string | null) => user && setIssued({ uid: user.uid, code: next });

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const url = code ? `${window.location.origin}/join?code=${code}` : '';
  const message = `${name || 'המאמן שלך'} מזמין אותך למסלול. הצטרפו כאן:\n${url}`;

  const share = async () => {
    haptic('tap');
    // The native sheet is the right surface on a phone; WhatsApp is where this
    // actually gets sent. Copying is the fallback when there is no share API.
    if (navigator.share) {
      await navigator.share({ title: 'הצטרפות למסלול', text: message }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(message).catch(() => {});
    setCopied(true);
    toast({ text: 'הקישור הועתק', tone: 'ok' });
  };

  const copyCode = async () => {
    if (!code) return;
    haptic('select');
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
  };

  if (!user) {
    return (
      <section className="rounded-[var(--radius-lg)] bg-sky p-6">
        <h3 className="text-[18px]">כדי לצרף מתאמנים צריך חשבון</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-on-tint/72">
          החשבון הוא מה שמאפשר למתאמן להתחבר אליכם ולראות את המסלול שתבנו.
        </p>
        <Button size="lg" className="mt-5" onClick={onNeedsAccount}>
          התחברות עם גוגל
        </Button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-soft)]">
      <div className="p-6 pb-5">
        <h3 className="text-[18px]">קוד ההצטרפות שלכם</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
          שלחו את הקישור למתאמן. כל בקשה תחכה לאישור שלכם.
        </p>

        <button
          type="button"
          onClick={copyCode}
          aria-label="העתקת הקוד"
          className="mt-5 flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] bg-canvas px-5 py-4"
        >
          <span className="digits text-[26px] font-semibold tracking-[0.14em]">
            {code ?? '······'}
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copied ? 'done' : 'copy'}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 460, damping: 28 }}
              className={copied ? 'text-green' : 'text-faint'}
            >
              {copied ? <Check size={19} weight="bold" /> : <Copy size={19} weight="bold" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <div className="flex gap-3 border-t border-line p-4">
        <Button block size="lg" className="flex-1" disabled={!code} onClick={share}>
          <ShareNetwork size={17} weight="bold" />
          שיתוף הקישור
        </Button>
        <Button
          size="lg"
          variant="card"
          disabled={!code || busy}
          onClick={async () => {
            if (!user || !code) return;
            setBusy(true);
            const next = await rotateInvite(
              user.uid,
              name || user.displayName?.split(' ')[0] || 'המאמן',
              code,
            );
            setBusy(false);
            setCode(next);
            haptic('success');
            toast({ text: 'הקוד הוחלף', detail: 'הקישור הישן כבר לא עובד', tone: 'ok' });
          }}
        >
          <ArrowsClockwise size={16} weight="bold" />
          החלפה
        </Button>
      </div>
    </section>
  );
}
