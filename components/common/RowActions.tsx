import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

/** Icon buttons for a table row; labels include the record name for screen readers and tests. */
export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit?: () => void; onDelete?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {onEdit && (
        <Button variant="subtle" size="iconSm" aria-label={`${t('common.edit')} ${name}`} onClick={onEdit}>
          <Pencil />
        </Button>
      )}
      {onDelete && (
        <Button variant="subtle" size="iconSm" aria-label={`${t('common.delete')} ${name}`} onClick={onDelete} className="hover:text-danger-text">
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
