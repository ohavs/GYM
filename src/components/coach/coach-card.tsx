'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ChatCircleText, DotsThree, HourglassMedium, Link as LinkIcon } from '@phosphor-icons/react/dist/ssr';
import { Button, IconButton } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useLinksContext } from '@/components/app-providers';
import { endLink } from '@/lib/links';
import { useStore } from '@/lib/store';
import { initials } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';

/**
 * The trainee's view of their coach.
 *
 * Shown wherever the program is: who assigned it, what they said about it, and
 * a way out. The way out matters — a coach can see this person's training, and
 * ending that has to be one obvious tap rather than something to go hunting
 * for. Deleting the link is what actually cuts the access.
 */
export function CoachCard() {
  const toast = useToast();
  const links = useLinksContext();
  const program = useStore((s) => s.program);
  const setProgram = useStore((s) => s.setProgram);
  const [confirm, setConfirm] = useState(false);

  const active = links.asTrainee.find((l) => l.status === 'active');
  const pending = links.asTrainee.find((l) => l.status === 'pending');

  if (pending) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center gap-3.5 rounded-[var(--radius-lg)] bg-butter p-5"
      >
        <HourglassMedium size={21} weight="fill" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium">ממתין לאישור של {pending.coachName}</p>
          <p className="mt-0.5 text-[13px] text-on-tint/72">
            עד אז המסלול שלכם נשאר כמו שהוא
          </p>
        </div>
      </motion.div>
    );
  }

  if (!active) return null;

  const usingCoachProgram = program?.source === 'coach';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-[var(--radius-lg)] bg-mint p-5"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tint-well text-[14px] font-semibold">
            {initials(active.coachName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">{active.coachName}</p>
            <p className="text-[12.5px] text-on-tint/72">
              {usingCoachProgram ? 'המאמן שלכם' : 'מחוברים, ומתאמנים לפי המסלול האישי'}
            </p>
          </div>
          <IconButton
            label="ניהול הקשר עם המאמן"
            size="sm"
            tone="card"
            onClick={() => setConfirm(true)}
          >
            <DotsThree size={18} weight="bold" />
          </IconButton>
        </div>

        {active.coachNote && (
          <div className="mt-4 flex gap-3 border-t border-on-tint/12 pt-4">
            <ChatCircleText size={18} weight="fill" className="mt-0.5 shrink-0 text-on-tint/72" />
            <p className="text-[14px] leading-relaxed text-on-tint/72">{active.coachNote}</p>
          </div>
        )}
      </motion.div>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={active.coachName}
        subtitle="הקשר שלכם עם המאמן"
        footer={
          <div className="flex flex-col gap-3">
            <Button
              block
              size="lg"
              variant="danger"
              onClick={async () => {
                haptic('warn');
                await endLink(active.id);
                if (program?.source === 'coach') setProgram(null);
                setConfirm(false);
                toast({
                  text: 'הקשר נותק',
                  detail: 'המאמן כבר לא רואה את האימונים שלכם',
                  tone: 'info',
                });
              }}
            >
              ניתוק מהמאמן
            </Button>
            <Button block size="lg" variant="card" onClick={() => setConfirm(false)}>
              סגירה
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <Fact icon={<LinkIcon size={17} weight="bold" />} title="מה המאמן רואה">
            את האימונים שביצעתם ואת ההגדרות שלכם. הוא לא יכול לשנות שום דבר מהצד שלכם.
          </Fact>
          <Fact icon={<ChatCircleText size={17} weight="bold" />} title="מה המאמן יכול לעשות">
            לבנות ולעדכן את המסלול שלכם, ולהשאיר לכם הערות.
          </Fact>
          <p className="px-1 pt-1 text-[13.5px] leading-relaxed text-muted">
            ניתוק מפסיק את הגישה שלו מיידית. ההיסטוריה שלכם נשארת אצלכם.
          </p>
        </div>
      </Sheet>
    </>
  );
}

function Fact({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3.5 rounded-[var(--radius-md)] bg-card p-4 shadow-[var(--shadow-soft)]">
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-[14.5px] font-medium">{title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{children}</p>
      </div>
    </div>
  );
}
