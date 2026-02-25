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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateMilestone } from '@/hooks/useMilestones';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  order: z.number().int().min(1, 'Order must be at least 1'),
});

type MilestoneFormValues = z.infer<typeof milestoneSchema>;

interface CreateMilestoneFormProps {
  projectId: string;
  nextOrder?: number;
}

export function CreateMilestoneForm({ projectId, nextOrder = 1 }: CreateMilestoneFormProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const createMilestone = useCreateMilestone(projectId);

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: undefined,
      order: nextOrder,
    },
  });

  async function onSubmit(values: MilestoneFormValues): Promise<void> {
    try {
      await createMilestone.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        amount: values.amount,
        order: values.order,
      });
      toast.success('Milestone created');
      form.reset({ title: '', description: '', amount: undefined, order: nextOrder });
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
                <FormLabel className="text-xs">Description (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What should be delivered?"
                    className="min-h-[60px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
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
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
