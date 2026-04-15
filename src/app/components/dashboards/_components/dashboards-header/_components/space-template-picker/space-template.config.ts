export interface SpaceTemplate {
  id: string;
  name: string;
  description: string;
  category: SpaceTemplateCategory;
  illustration?: string;
  defaults: {
    statuses: string[];
    workTypes: string[];
  };
}

export type SpaceTemplateCategory =
  | 'Software development'
  | 'Service management'
  | 'Work management'
  | 'Product management'
  | 'Marketing'
  | 'Human resources'
  | 'Finance'
  | 'Design'
  | 'Personal'
  | 'Operations'
  | 'IT'
  | 'Made for you';

export const SPACE_TEMPLATE_CATEGORIES: SpaceTemplateCategory[] = [
  'Software development',
  'Service management',
  'Work management',
  'Product management',
  'Marketing',
  'Human resources',
  'Finance',
  'Design',
  'Personal',
  'Operations',
  'IT',
];

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  // Software development
  {
    id: 'scrum',
    name: 'Scrum',
    description: 'Plan and track work in sprints with your agile team.',
    category: 'Software development',
    defaults: {
      statuses: ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      workTypes: ['STORY', 'TASK', 'BUG', 'EPIC'],
    },
  },
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Work efficiently and visualize work with to do, doing, and done.',
    category: 'Software development',
    defaults: {
      statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
      workTypes: ['TASK', 'BUG'],
    },
  },
  {
    id: 'bug-tracking',
    name: 'Bug tracking',
    description: 'Track, prioritize, and squash bugs before they ship.',
    category: 'Software development',
    defaults: {
      statuses: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      workTypes: ['BUG', 'TASK'],
    },
  },

  // Work management
  {
    id: 'blank',
    name: 'Blank space',
    description: 'Start with a blank canvas.',
    category: 'Work management',
    defaults: {
      statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
      workTypes: ['TASK'],
    },
  },
  {
    id: 'project-management',
    name: 'Project management',
    description: 'Plan and deliver business projects.',
    category: 'Work management',
    defaults: {
      statuses: ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      workTypes: ['TASK', 'EPIC'],
    },
  },
  {
    id: 'task-tracking',
    name: 'Task tracking',
    description: 'Organize and track team or personal tasks.',
    category: 'Work management',
    defaults: {
      statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
      workTypes: ['TASK'],
    },
  },

  // Product management
  {
    id: 'product-discovery',
    name: 'Product discovery',
    description: 'Prioritize ideas then connect them from discovery through to delivery.',
    category: 'Product management',
    defaults: {
      statuses: ['IDEA', 'EVALUATING', 'IN_PROGRESS', 'SHIPPED'],
      workTypes: ['STORY', 'EPIC'],
    },
  },

  // Design
  {
    id: 'ux-design',
    name: 'UX design',
    description: 'Track design work from concept to delivery.',
    category: 'Design',
    defaults: {
      statuses: ['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      workTypes: ['TASK', 'STORY'],
    },
  },

  // Marketing
  {
    id: 'go-to-market',
    name: 'Go-to-Market',
    description: 'Plan and launch new products or services.',
    category: 'Marketing',
    defaults: {
      statuses: ['PLANNING', 'IN_PROGRESS', 'LAUNCHED'],
      workTypes: ['TASK', 'EPIC'],
    },
  },
];

/** Templates shown under "Made for you" — a curated subset. */
export const MADE_FOR_YOU_IDS = ['kanban', 'scrum', 'blank', 'project-management'];

export const MADE_FOR_YOU_SPACE_TEMPLATE: SpaceTemplateCategoryContent = {
  heading: 'Made for you',
  description: 'Templates for you based on how similar teams work.',
  filteredTemplates: [
    {
      id: 'productDiscovery',
      name: 'Product Discovery',
      description: 'Prioritize ideas then connect them from discovery through delivery',
      category: 'Made for you',
      defaults: {
        statuses: [],
        workTypes: [],
      },
    },
    {
      id: 'kanban',
      name: 'Kanban',
      description: 'Work efficiently and visualize work with to do, doing, and done.',
      category: 'Made for you',
      defaults: {
        statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
        workTypes: ['TASK', 'BUG'],
      },
    },
    {
      id: 'scrum',
      name: 'Scrum',
      description: 'Plan and track work in sprints with your agile team.',
      category: 'Made for you',
      defaults: {
        statuses: ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
        workTypes: ['STORY', 'TASK', 'BUG', 'EPIC'],
      },
    },
  ],
}

export const SOFTWARE_DEVELOPMENT_SPACE_CATEGORY: SpaceTemplateCategoryContent = {
  heading: 'Software Development',
  description: 'Plan, track and release great software. Get up and running quickly with templates that suit the way your team works. Plus, integrations for DevOps teams that want to connect work across their entire toolchain.',
  filteredTemplates: [
    {
      id: 'kanban',
      name: 'Kanban',
      description: 'Work efficiently and visualize work with to do, doing, and done.',
      category: 'Software development',
      defaults: {
        statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
        workTypes: ['TASK', 'BUG'],
      },
    },
    {
      id: 'scrum',
      name: 'Scrum',
      description: 'Plan and track work in sprints with your agile team.',
      category: 'Software development',
      defaults: {
        statuses: ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
        workTypes: ['STORY', 'TASK', 'BUG', 'EPIC'],
      },
    },
    {
      id: 'bug-tracking',
      name: 'Bug tracking',
      description: 'Track, prioritize, and squash bugs before they ship.',
      category: 'Software development',
      defaults: {
        statuses: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        workTypes: ['BUG', 'TASK'],
      },
    },
    {
      id: 'cross-teamPlanning',
      name: 'Cross-team planning',
      description: 'Align Items on shared goals and timelines',
      category: 'Software development',
      defaults: {
        statuses: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        workTypes: ['BUG', 'TASK'],
      },
    },
  ],
}

export const SERVICE_MANAGEMENT_SPACE_CATEGORY: SpaceTemplateCategoryContent = {
  heading: 'Service Management',
  description: 'Empower every team, from IT to HR to marketing, as they collect, prioritize, assign, and track incoming requests with ease. Get up and running quickly by selecting one of our tailored templates that include pre-configured workflows, forms, and settings based on service management best practices.',
  filteredTemplates: [
    {
      id: 'blackSpace',
      name: 'Blank Space',
      description: 'Start fresh with a blank space and customize how you manage incoming service requests.',
      category: 'Service management',
      defaults: {
        statuses: [],
        workTypes: [],
      },
    },
    {
      id: 'developmentRequest',
      name: 'Development Request',
      description: 'Easily sync new feature requests, bugs, and incidents with your backlog.',
      category: 'Service management',
      defaults: {
        statuses: [],
        workTypes: [],
      },
    },
    {
      id: 'generalServiceManagement',
      name: 'General Service Management',
      description: 'Create one place to collect and manage any type of request.',
      category: 'Service management',
      defaults: {
        statuses: [],
        workTypes: [],
      },
    },
  ],
}

export const SPACES: Record<SpaceTemplateCategory, SpaceTemplateCategoryContent> = {
  'Made for you': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Software development': SOFTWARE_DEVELOPMENT_SPACE_CATEGORY,
  'Service management': SERVICE_MANAGEMENT_SPACE_CATEGORY,
  'Work management': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Product management': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Marketing': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Human resources': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Finance': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Design': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Personal': MADE_FOR_YOU_SPACE_TEMPLATE,
  'Operations': MADE_FOR_YOU_SPACE_TEMPLATE,
  'IT': MADE_FOR_YOU_SPACE_TEMPLATE,
}

export interface SpaceTemplateCategoryContent {
  heading: string;
  description: string;
  filteredTemplates: SpaceTemplate[];
}