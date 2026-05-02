export interface SpaceTemplate {
  id: string;
  name: string;
  description: string;          // card description
  category: SpaceTemplateCategory[];
  illustration?: string;

  // modal / detail view
  modalTitle: string;
  modalDescription: string;
  templateFeatures: { img: string; title: string; description: string }[];
  product: { label: string }[];
  recommendedFor: string[];
  workTypes: { label: string; icon: string }[];
  workflow: { label: string; classes: string[] }[];

  // form / creation defaults
  defaults: { statuses: string[]; workTypes: string[] };
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
    id: 'kanban',
    name: 'Kanban',
    description: 'Track, prioritize, and squash bugs before they ship',
    category: ['Software development'],
    modalTitle: 'Kanban',
    modalDescription: 'Kanban (the Japanese word for "visual signal") is all about helping teams visualize their work, limit work currently in progress, and maximize efficiency. Use the Kanban template to increase planning flexibility, reduce bottlenecks and promote transparency throughout the development cycle.',
    illustration: './assets/illustrations/kanban.svg',
    templateFeatures: [
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/kanban.250d7761.png',
        title: 'Track work using a simple board',
        description: 'Work items are represented visually on your kanban board, allowing teams to track the status of work at any time. The columns on your board represent each step in your team’s workflow, from to-do to done.',
      },
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/columns-and-progress.fabc7765.png',
        title: 'Use the board to limit work in progress',
        description: 'Set the maximum amount of work that can exist in each status with work in progress (WIP) limits. By limiting work in progress, you can improve team focus, and better identify inefficiencies and bottlenecks.',
      },
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/agile-reports.60c73c97.png',
        title: 'Continuously improve with agile reports',
        description: 'One of the key tenets of kanban is optimizing flow for continuous delivery. Agile reports, like the cumulative flow diagram, help ensure your team are consistently delivering maximum value back to your business.',
      },
    ],
    product: [
      {
        label: 'crayon-office'
      }
    ],
    recommendedFor: [
      'Teams that control work volume from a backlog',
      'DevOps teams that want to connect work across their tools',
    ],
    workTypes: [
      {
        label: 'Epic',
        icon: '',
      },
      {
        label: 'Story',
        icon: '',
      },
      {
        label: 'Bug',
        icon: '',
      },
      {
        label: 'Task',
        icon: '',
      },
      {
        label: 'Sub-task',
        icon: '',
      }
    ],
    workflow: [
      {
        label: 'To do',
        classes: ['to-do']
      },
      {
        label: 'In progress',
        classes: ['in-progress']
      },
      {
        label: 'Done',
        classes: ['done']
      },
    ],
    defaults: {
      statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
      workTypes: ['TASK', 'BUG'],
    },
  },
  {
    id: 'scrum',
    name: 'Scrum',
    description: 'Plan and track work in sprints with your agile team.',
    category: ['Software development'],
    modalTitle: 'Scrum',
    modalDescription: 'The Scrum template helps teams work together using sprints to break down large, complex projects into bite-sized pieces of value. Encourage your team to learn through incremental delivery, self-organize while working on a problem, and regularly reflect on their wins and losses to continuously improve.',
    illustration: './assets/illustrations/scrum.svg',
    templateFeatures: [
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/backlog.87c4d35e.svg',
        title: 'Plan upcoming work in a backlog',
        description: 'Prioritize and plan your teams work on the backlog. Break down work from your project timeline, and order work items so your team knows what to deliver first.',
      },
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/agile-on-grid.fb85a74b.png',
        title: 'Organize cycles of work into sprints',
        description: 'Sprints are short, time-boxed periods when a team collaborates to complete a set amount of customer value. Use sprints to drive incremental delivery, allow your team to ship high-quality work and deliver value faster.',
      },
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/bar-chart.a199c1ca.png',
        title: 'Understand your team’s velocity',
        description: 'Improve predictability on planning and delivery with out-of-the-box reports, including the sprint report and velocity chart. Empower your team to understand their capacity and iterate on their processes.',
      },
    ],
    product: [
      {
        label: 'crayon-office'
      }
    ],
    recommendedFor: [
      'Teams that deliver work on a regular cadence',
      'DevOps teams that want to connect work across their tools',
    ],
    workTypes: [
      {
        label: 'Epic',
        icon: '',
      },
      {
        label: 'Story',
        icon: '',
      },
      {
        label: 'Bug',
        icon: '',
      },
      {
        label: 'Task',
        icon: '',
      },
      {
        label: 'Sub-task',
        icon: '',
      }
    ],
    workflow: [
      {
        label: 'To do',
        classes: ['to-do']
      },
      {
        label: 'In progress',
        classes: ['in-progress']
      },
      {
        label: 'Done',
        classes: ['done']
      },
    ],
    defaults: {
      statuses: ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      workTypes: ['STORY', 'TASK', 'BUG', 'EPIC'],
    },
  },
  {
    id: 'bugTracking',
    name: 'Bug tracking',
    description: 'Track, prioritize, and squash bugs before they ship',
    category: ['Software development'],
    modalTitle: 'Bug tracking',
    modalDescription: 'Capture, track and resolve bugs and issues throughout your entire development process. Provide a single source of truth of all your issues and help your team prioritize against their big picture goals, while continually delivering value to your customers.',
    illustration: './assets/illustrations/bug-tracking.svg',
    templateFeatures: [
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/bug-tracking.8e7deba7.png',
        title: 'Identify and capture bugs',
        description: 'See all your bugs in one place. Once you’ve identified a bug, capture its details by creating a work item from anywhere in your space. Each unique work type can have its own custom workflow.',
      },
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/warning-assigned-tickets.5e447186.png',
        title: 'Assign and prioritize',
        description: 'Once captured, bugs can be ranked and prioritized based on importance, urgency, and your team’s workload capacity. Assigning bugs is easy and can be accomplished in only a few keystrokes from the work item.',
      },
      {
        img: 'https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/ticket-in-workflow-red.2ef11b7c.png',
        title: 'Track bugs to done',
        description: 'Stay in the know by tracking bugs and work items through your team’s workflow. Transitioning work items will trigger notifications, automatically informing the next reviewer.',
      },
    ],
    product: [
      {
        label: 'crayon-office'
      }
    ],
    recommendedFor: [
      'Teams that are capturing, tracking, and resolving bugs',
    ],
    workTypes: [
      {
        label: 'Epic',
        icon: '',
      },
      {
        label: 'Bug',
        icon: '',
      },
      {
        label: 'Improvement',
        icon: '',
      },
      {
        label: 'New Feature',
        icon: '',
      },
      {
        label: 'Task',
        icon: '',
      },
      {
        label: 'Sub-task',
        icon: '',
      }
    ],
    workflow: [
      {
        label: 'To do',
        classes: ['to-do']
      },
      {
        label: 'In progress',
        classes: ['in-progress']
      },
      {
        label: 'In review',
        classes: ['in-review']
      },
      {
        label: 'Done',
        classes: ['done']
      },
    ],
    defaults: {
      statuses: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      workTypes: ['BUG', 'TASK'],
    },
  }

  //   // Work management
  //   {
  //     id: 'blank',
  //     name: 'Blank space',
  //     description: 'Start with a blank canvas.',
  //     category: 'Work management',
  //     defaults: {
  //       statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
  //       workTypes: ['TASK'],
  //     },
  //   },
  //   {
  //     id: 'project-management',
  //     name: 'Project management',
  //     description: 'Plan and deliver business projects.',
  //     category: 'Work management',
  //     defaults: {
  //       statuses: ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
  //       workTypes: ['TASK', 'EPIC'],
  //     },
  //   },
  //   {
  //     id: 'task-tracking',
  //     name: 'Task tracking',
  //     description: 'Organize and track team or personal tasks.',
  //     category: 'Work management',
  //     defaults: {
  //       statuses: ['TO_DO', 'IN_PROGRESS', 'DONE'],
  //       workTypes: ['TASK'],
  //     },
  //   },

  //   // Product management
  //   {
  //     id: 'product-discovery',
  //     name: 'Product discovery',
  //     description: 'Prioritize ideas then connect them from discovery through to delivery.',
  //     category: 'Product management',
  //     defaults: {
  //       statuses: ['IDEA', 'EVALUATING', 'IN_PROGRESS', 'SHIPPED'],
  //       workTypes: ['STORY', 'EPIC'],
  //     },
  //   },

  //   // Design
  //   {
  //     id: 'ux-design',
  //     name: 'UX design',
  //     description: 'Track design work from concept to delivery.',
  //     category: 'Design',
  //     defaults: {
  //       statuses: ['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
  //       workTypes: ['TASK', 'STORY'],
  //     },
  //   },

  //   // Marketing
  //   {
  //     id: 'go-to-market',
  //     name: 'Go-to-Market',
  //     description: 'Plan and launch new products or services.',
  //     category: 'Marketing',
  //     defaults: {
  //       statuses: ['PLANNING', 'IN_PROGRESS', 'LAUNCHED'],
  //       workTypes: ['TASK', 'EPIC'],
  //     },
  //   },
];

/** Templates shown under "Made for you" — a curated subset. */
export const MADE_FOR_YOU_IDS = ['kanban', 'scrum', 'blank', 'project-management'];

export const CATEGORY_META: Record<SpaceTemplateCategory, { heading: string; description: string }> = {
  'Made for you': {
    heading: 'Made for you',
    description: 'Templates for you based on how similar teams work.',
  },
  'Software development': {
    heading: 'Software Development',
    description: 'Plan, track and release great software. Get up and running quickly with templates that suit the way your team works. Plus, integrations for DevOps teams that want to connect work across their entire toolchain.',
  },
  'Service management': {
    heading: 'Service Management',
    description: 'Empower every team, from IT to HR to marketing, as they collect, prioritize, assign, and track incoming requests with ease. Get up and running quickly by selecting one of our tailored templates that include pre-configured workflows, forms, and settings based on service management best practices.',
  },
  'Design': {
    heading: '',
    description: '',
  },
  'Finance': {
    heading: '',
    description: '',
  },
  'Human resources': {
    heading: '',
    description: '',
  },
  'IT': {
    heading: '',
    description: '',
  },
  'Marketing': {
    heading: '',
    description: '',
  },
  'Operations': {
    heading: '',
    description: '',
  },
  'Personal': {
    heading: '',
    description: '',
  },
  'Product management': {
    heading: '',
    description: '',
  },
  'Work management': {
    heading: '',
    description: '',
  },
};

