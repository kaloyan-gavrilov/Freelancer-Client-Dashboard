export type ProjectStatus = 'Draft' | 'Open' | 'In Progress' | 'Completed';

export type Milestone = {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
};

export type Bid = {
  id: string;
  freelancer: {
    id: string;
    name: string;
    rating: number;
  };
  proposed_rate: number;
  cover_letter: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budgetMin: number;
  budgetMax: number;
  requiredSkills: string[];
  deadline: string;
  bids: Bid[];
  milestones: Milestone[];
  canTransition: boolean;
  nextStatus: ProjectStatus;
  nextStatusLabel: string;
};
