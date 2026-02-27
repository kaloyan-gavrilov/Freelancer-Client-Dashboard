import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateProject } from '@/hooks/useProjects';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    budgetMin: z.number().min(0, 'Must be ≥ 0'),
    budgetMax: z.number().min(0, 'Must be ≥ 0'),
    deadline: z.string().min(1, 'Deadline is required'),
    projectType: z.enum(['FIXED', 'HOURLY']),
  })
  .refine((d) => d.budgetMax >= d.budgetMin, {
    message: 'Budget max must be ≥ budget min',
    path: ['budgetMax'],
  });

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateProjectForm(): React.ReactElement {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  // Tag input state for required skills
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      budgetMin: undefined,
      budgetMax: undefined,
      deadline: '',
      projectType: 'FIXED',
    },
  });

  // ── Tag helpers ──────────────────────────────────────────────────────────

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues): Promise<void> {
    const allTags = tagInput.trim()
      ? [...new Set([...tags, tagInput.trim()])]
      : tags;

    try {
      const project = await createProject.mutateAsync({
        title: values.title,
        description: values.description,
        budgetMin: values.budgetMin,
        budgetMax: values.budgetMax,
        deadline: values.deadline,
        projectType: values.projectType,
        requiredSkills: allTags,
      });
      toast.success('Project created and published!');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Build a landing page" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the project scope, goals, and deliverables…"
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Budget row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Min ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="500"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Max ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="2000"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Deadline + type row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" min={today} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project type toggle */}
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <FormControl>
                        <div
                          role="group"
                          aria-label="Project type"
                          className="flex rounded-md border overflow-hidden"
                        >
                          {(['FIXED', 'HOURLY'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => field.onChange(type)}
                              className={`flex-1 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                field.value === type
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              {type === 'FIXED' ? 'Fixed' : 'Hourly'}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Required Skills (tag input) */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Required Skills
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
                </label>
                <div
                  className="flex flex-wrap gap-1.5 min-h-[40px] rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                  onClick={() => document.getElementById('skills-input')?.focus()}
                >
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setTags((p) => p.filter((t) => t !== tag)); }}
                        aria-label={`Remove ${tag}`}
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    id="skills-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                    placeholder={tags.length === 0 ? 'React, Node.js… (Enter or comma to add)' : ''}
                    className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/client/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending ? 'Publishing…' : 'Create & Publish'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
