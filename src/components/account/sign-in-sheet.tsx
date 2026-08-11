'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { CloudCheck, DeviceMobile, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { firebaseEnabled, signInWithGoogle } from '@/lib/firebase';
import { useToast } from '@/components/ui/toast';

const REASONS = [
  {
    icon: <CloudCheck size={19} weight="bold" />,
    tint: 'bg-mint',
    title: 'הנתונים נשמרים',
    body: 'המסלול, ההיסטוריה והשיאים לא ייעלמו אם תנקו את הדפדפן.',
  },
  {
    icon: <DeviceMobile size={19} weight="bold" />,
    tint: 'bg-peach',
    title: 'אותו חשבון בכל מכשיר',
    body: 'מתחילים אימון בטלפון, ממשיכים במחשב.',
  },
  {
    icon: <UsersThree size={19} weight="bold" />,
    tint: 'bg-lilac',
    title: 'עבודה עם מאמן',
    body: 'מאמן יוכל לבנות לכם מסלול ולראות את ההתקדמות.',
  },
];

/** Google-branded mark. Drawn inline because the official asset is a fixed SVG. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      toast({ text: 'ההתחברות נכשלה', detail: 'נסו שוב בעוד רגע', tone: 'warn' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="שמרו את ההתקדמות"
      subtitle="חשבון גוגל, בלי סיסמאות"
      footer={
        <div className="flex flex-col gap-3">
          <Button block size="lg" variant="card" loading={busy} onClick={signIn}>
            <GoogleMark />
            המשך עם גוגל
          </Button>
          <Button block variant="quiet" onClick={onClose}>
            אולי אחר כך
          </Button>
        </div>
      }
    >
      <ul className="flex flex-col gap-3 py-2">
        {REASONS.map((reason, i) => (
          <motion.li
            key={reason.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4 rounded-[var(--radius-md)] bg-card p-4 shadow-[var(--shadow-soft)]"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-full ${reason.tint}`}>
              {reason.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium">{reason.title}</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">
                {reason.body}
              </span>
            </span>
          </motion.li>
        ))}
      </ul>

      {!firebaseEnabled && (
        <p className="px-1 pb-2 text-[13px] leading-relaxed text-muted">
          לא הוגדר פרויקט Firebase, אז האפליקציה פועלת מקומית בלבד. הוסיפו את מפתחות
          NEXT_PUBLIC_FIREBASE בקובץ הסביבה כדי להפעיל חשבונות.
        </p>
      )}
    </Sheet>
  );
}
