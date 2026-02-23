import { Milestone } from '@/types/project.types';

type Props = {
  milestones: Milestone[];
};

const statusStyles: Record<Milestone['status'], { color: string; icon: string }> = {
  'Pending': {
    color: '#facc15', 
    icon: '⏳',        
  },
  'In Progress': {
    color: '#3b82f6', 
    icon: '🔄',       
  },
  'Completed': {
    color: '#22c55e', 
    icon: '✅',        
  },
};

export function MilestoneList({ milestones }: Props) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {milestones.map((m) => {
        const { color, icon } = statusStyles[m.status];
        return (
          <li key={m.id} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{m.title}</span>
            <span
              style={{
                backgroundColor: color,
                color: '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>{icon}</span>
              <span>{m.status}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
