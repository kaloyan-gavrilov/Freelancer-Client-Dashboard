import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSubmitBid } from '@/hooks/useBids';
import type { Project } from '@/types/domain';

const bidSchema = z.object({
  proposedRate: z
    .number()
    .positive('Rate must be greater than 0'),
  estimatedDurationDays: z
    .number()
    .int()
    .min(1, 'At least 1 day'),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
});

type BidFormValues = z.infer<typeof bidSchema>;

interface BidModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BidModal({ project, open, onOpenChange }: BidModalProps): React.ReactElement {
  const submitBid = useSubmitBid(project.id);

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      proposedRate: undefined,
      estimatedDurationDays: undefined,
      coverLetter: '',
    },
  });

  async function onSubmit(values: BidFormValues): Promise<void> {
    try {
      await submitBid.mutateAsync(values);
      toast.success('Bid submitted successfully!');
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit bid');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Bid</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {project.title}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proposedRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="75"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value),
                          )
                        }
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedDurationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value),
                          )
                        }
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your experience and why you're a great fit for this project... (min. 50 characters)"
                      className="min-h-[140px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {field.value.length} / 50 min
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitBid.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitBid.isPending}>
                {submitBid.isPending ? 'Submitting…' : 'Submit Bid'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
