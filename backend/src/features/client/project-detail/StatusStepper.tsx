import { ProjectStatus } from '@/types/project.types';

type Props = {
  status: ProjectStatus;
};

const statusStyles: Record<ProjectStatus, { color: string; icon: string }> = {
  'Draft': {
    color: '#9ca3af', 
    icon: '📝',        
  },
  'Open': {
    color: '#3b82f6', 
    icon: '📢',        
  },
  'In Progress': {
    color: '#facc15', 
    icon: '🔧',       
  },
  'Completed': {
    color: '#22c55e', 
    icon: '🏁',        
  },
};

export function StatusStepper({ status }: Props) {
  const steps: ProjectStatus[] = ['Draft', 'Open', 'In Progress', 'Completed'];

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {steps.map((step) => {
        const isActive = step === status;
        const { color, icon } = statusStyles[step];

        return (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? color : '#6b7280', 
            }}
          >
            <span>{icon}</span>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
