import { useForm } from 'react-hook-form';
import { useCreateProject } from './useCreateProject';
import { useNavigate } from 'react-router-dom';

type CreateProjectDto = {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  requiredSkills: string[];
  deadline: string;
};

export function CreateProjectPage() {
  const { register, handleSubmit } = useForm<CreateProjectDto>();
  const { mutateAsync } = useCreateProject();
  const navigate = useNavigate();

  const onSubmit = async (data: CreateProjectDto) => {
    const project = await mutateAsync(data);
    navigate(`/client/projects/${project.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} placeholder="Title" />
      <textarea {...register('description')} placeholder="Description" />
      <input type="number" {...register('budgetMin')} placeholder="Min Budget" />
      <input type="number" {...register('budgetMax')} placeholder="Max Budget" />
      <input {...register('requiredSkills')} placeholder="Skills (comma separated)" />
      <input type="date" {...register('deadline')} />
      <button type="submit">Create Project</button>
    </form>
  );
}
