import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { useLogTime } from '@/hooks/useTimeEntries';

const schema = z.object({
  hours: z.number().positive('Must be > 0').max(24, 'Max 24 hours per entry'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
});

type FormValues = z.infer<typeof schema>;

interface TimeEntryFormProps {
  projectId: string;
}

export function TimeEntryForm({ projectId }: TimeEntryFormProps): React.ReactElement {
  const logTime = useLogTime(projectId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hours: undefined,
      date: new Date().toISOString().slice(0, 10),
      description: '',
    },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    try {
      await logTime.mutateAsync({
        hours: values.hours,
        date: new Date(values.date).toISOString(),
        description: values.description,
      });
      toast.success('Time logged successfully');
      form.reset({
        hours: undefined,
        date: new Date().toISOString().slice(0, 10),
        description: '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log time');
    }
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <h4 className="text-sm font-medium">Log Time</h4>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      placeholder="2.5"
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What did you work on?"
                    className="min-h-[60px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={logTime.isPending}>
              {logTime.isPending ? 'Saving…' : 'Log Time'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
