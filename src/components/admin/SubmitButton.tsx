
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isSubmitting: boolean;
  label: string;
  loadingLabel: string;
}

export function SubmitButton({ isSubmitting, label, loadingLabel }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
