import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateMilestone, useMilestones } from '@/hooks/useMilestones';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateMilestoneFormProps {
  projectId: string;
}

export function CreateMilestoneForm({ projectId }: CreateMilestoneFormProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const createMilestone = useCreateMilestone(projectId);
  const { data: milestones } = useMilestones(projectId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      amount: undefined,
      description: '',
    },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    const nextOrder = milestones?.length ?? 0;
    try {
      await createMilestone.mutateAsync({
        title: values.title,
        amount: values.amount,
        order: nextOrder,
        description: values.description || undefined,
      });
      toast.success('Milestone created');
      form.reset({ title: '', amount: undefined, description: '' });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create milestone');
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 mt-3"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Milestone
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 mt-3 space-y-3">
      <h4 className="text-sm font-medium">New Milestone</h4>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Design mockups" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  Description{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Brief description of this milestone…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Amount ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="500"
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

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMilestone.isPending}>
              {createMilestone.isPending ? 'Creating…' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
