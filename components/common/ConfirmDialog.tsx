import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/input';
import { Label } from '../ui/label';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog(p: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (p.open) setReason('');
  }, [p.open]);

  const confirm = async () => {
    setBusy(true);
    try {
      await p.onConfirm(p.requireReason ? reason.trim() : undefined);
      p.onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{p.title}</DialogTitle>
          {p.description ? <DialogDescription>{p.description}</DialogDescription> : <DialogDescription className="sr-only">{p.title}</DialogDescription>}
        </DialogHeader>
        {p.requireReason && (
          <DialogBody className="flex flex-col gap-1">
            <Label htmlFor="confirm-reason">{p.reasonLabel ?? t('common.reason')}</Label>
            <Textarea id="confirm-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => p.onOpenChange(false)} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant={p.tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} loading={busy} disabled={p.requireReason && !reason.trim()}>
            {p.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
