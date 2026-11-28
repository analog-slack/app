import { APP_NAME } from '@/shared/config';

import type { Dictionary } from './ru';

import { enWorkspaces } from './workspaces';

export const en: Dictionary = {
  meta: {
    title: `${APP_NAME} — tasks and conversations in one place`,
    description:
      'A kanban board with a built-in messenger. Open a chat right from a task card and invite teammates to the discussion.',
  },
  header: {
    features: 'Features',
    how: 'How it works',
    faq: 'FAQ',
    login: 'Log in',
    register: 'Sign up',
    home: 'Back to home',
    navLabel: 'Page sections',
    toggleTheme: 'Toggle theme',
    switchLocale: 'Переключить на русский',
    otherLocale: 'RU',
  },
  hero: {
    title: 'Discuss the task right where it lives',
    subtitle:
      'A kanban board and a messenger in one window. Open a chat straight from a card and bring teammates in — the conversation stays next to the task instead of getting lost in a shared channel.',
    primary: 'Sign up',
    secondary: 'Log in',
  },
  mockup: {
    alt: 'Sample board: the task “Landing page for the home screen” has a chat open where teammates agree and move it to Done.',
    project: 'Product launch',
    columns: { todo: 'Planned', doing: 'In progress', done: 'Done' },
    tags: { design: 'Design', backend: 'Backend', research: 'Research' },
    cards: {
      feedback: 'Collect feedback on the new board',
      notifications: 'Set up notifications',
      landing: 'Landing page for the home screen',
      csv: 'Import tasks from CSV',
      auth: 'Email login',
    },
    chat: {
      title: 'Task chat',
      marina: 'Marina',
      igor: 'Igor',
      first: 'First screen and login buttons are ready. Take a look?',
      invited: 'Marina invited Igor',
      second: 'Looking. All good, ready to ship.',
      third: 'Moving it to Done then.',
      moved: 'Task moved to Done',
      placeholder: 'Message this task',
    },
  },
  features: {
    title: 'Three tools that usually live in separate tabs',
    taskChat: {
      title: 'A chat inside every task',
      text: 'Each card has its own chat. Open it, invite the people you need, and every question and decision about the task stays in one place.',
      sample: 'Who can review the mockup?',
      reply: 'I will look today',
    },
    board: {
      title: 'Kanban board',
      text: 'Plan tasks and move cards across columns. See at a glance what is in progress and what is stuck.',
    },
    messenger: {
      title: 'Built-in messenger',
      text: 'Conversations for everything that is not tied to a specific task. No separate chat app needed.',
    },
  },
  how: {
    title: 'From task to decision in four steps',
    steps: [
      {
        title: 'Create a task',
        text: 'Add a card to the board and describe what needs to be done.',
      },
      {
        title: 'Open the task chat',
        text: 'One button on the card, and the task gets its own discussion.',
      },
      {
        title: 'Invite teammates',
        text: 'Bring in the people whose input you need. They see which task it is about right away.',
      },
      {
        title: 'Agree and move on',
        text: 'The decision stays in the task chat, and the card moves to the next column.',
      },
    ],
  },
  faq: {
    title: 'Common questions',
    items: [
      {
        q: 'How is this different from a tracker plus a messenger?',
        a: 'You never have to hunt for the discussion: the chat is attached to the task and opens from its card. No more forwarding links and explaining the context.',
      },
      {
        q: 'Who takes part in a task chat?',
        a: 'The people you invite. You can bring a teammate in at any time — they see the discussion together with the task itself.',
      },
      {
        q: 'Can we chat about things other than tasks?',
        a: 'Yes. The built-in messenger also works on its own, for questions that are not tied to a card.',
      },
      {
        q: 'Do I need to install anything?',
        a: `No. ${APP_NAME} runs in the browser: sign up and create your first board.`,
      },
    ],
  },
  cta: {
    title: 'Try it on your next task',
    primary: 'Sign up',
    secondary: 'Log in',
  },
  footer: {
    tagline: 'Tasks and conversations in one place.',
  },
  workspaces: enWorkspaces,
  auth: {
    login: {
      title: 'Log in',
      subtitle: 'Log in to get back to your tasks.',
      submit: 'Log in',
      alt: 'No account yet?',
      altLink: 'Sign up',
    },
    register: {
      title: 'Sign up',
      subtitle: 'Create an account to set up your first board.',
      submit: 'Sign up',
      alt: 'Already have an account?',
      altLink: 'Log in',
    },
    fields: {
      name: 'Username',
      email: 'Email',
      password: 'Password',
      confirm: 'Repeat password',
    },
    errors: {
      nameRequired: 'Enter your name',
      nameMax: 'Username must be at most 100 characters',
      emailInvalid: 'Enter an email like name@example.com',
      passwordRequired: 'Enter your password',
      passwordMin: 'Password must be at least 8 characters',
      passwordMax: 'Password must be at most 128 characters',
      confirmMismatch: 'Passwords do not match',
      invalidCredentials: 'The email or password is incorrect.',
      accountExists: 'An account with this email or username already exists.',
      unavailable: 'The request failed. Please try again.',
    },
    profile: { title: 'Profile', logout: 'Log out' },
    loading: 'Checking your session',
    retry: 'Try again',
  },
};
