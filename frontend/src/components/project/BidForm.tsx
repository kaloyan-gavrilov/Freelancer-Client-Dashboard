import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
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
import { useSubmitBid, useSubmittedBidProjects } from '@/hooks/useBids';
import type { Project } from '@/types/domain';

const bidSchema = z.object({
  proposedRate: z.number().positive('Rate must be greater than 0'),
  estimatedDurationDays: z.number().int().min(1, 'At least 1 day'),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
});

type BidFormValues = z.infer<typeof bidSchema>;

interface BidFormProps {
  project: Project;
}

export function BidForm({ project }: BidFormProps): React.ReactElement {
  const { data: submittedProjects = [] } = useSubmittedBidProjects();
  const submitBid = useSubmitBid(project.id);
  const alreadyBid = submittedProjects.includes(project.id);

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit bid');
    }
  }

  if (alreadyBid) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-5">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium">Bid submitted</p>
          <p className="text-xs text-muted-foreground">
            You have already submitted a bid on this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Submit Your Bid</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
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
                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
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
                    placeholder="Describe your experience and why you're a great fit for this project… (min. 50 characters)"
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

          <div className="flex justify-end">
            <Button type="submit" disabled={submitBid.isPending}>
              {submitBid.isPending ? 'Submitting…' : 'Submit Bid'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
