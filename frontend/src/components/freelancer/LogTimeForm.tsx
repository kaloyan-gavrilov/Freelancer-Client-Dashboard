import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLogTime } from '@/hooks/useTimeEntries';

const logTimeSchema = z.object({
  hours: z
    .number()
    .positive('Must be > 0')
    .max(24, 'Max 24 hours per entry'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

type LogTimeValues = z.infer<typeof logTimeSchema>;

interface LogTimeFormProps {
  projectId: string;
  onClose: () => void;
}

export function LogTimeForm({ projectId, onClose }: LogTimeFormProps): React.ReactElement {
  const logTime = useLogTime(projectId);

  const form = useForm<LogTimeValues>({
    resolver: zodResolver(logTimeSchema),
    defaultValues: {
      hours: undefined,
      description: '',
      date: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(values: LogTimeValues): Promise<void> {
    try {
      await logTime.mutateAsync({
        ...values,
        date: new Date(values.date).toISOString(),
      });
      toast.success('Time logged successfully');
      form.reset({ hours: undefined, description: '', date: new Date().toISOString().slice(0, 10) });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log time');
    }
  }

  return (
    <div className="rounded-md border bg-muted/30 p-4 mt-3">
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

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={logTime.isPending}>
              {logTime.isPending ? 'Saving…' : 'Log Time'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface LogTimeToggleProps {
  projectId: string;
}

export function LogTimeToggle({ projectId }: LogTimeToggleProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5"
        >
          <Clock className="h-3.5 w-3.5" />
          Log Time
        </Button>
      ) : (
        <LogTimeForm projectId={projectId} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
