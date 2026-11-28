import { getAuthProfileQueryKey, type AuthUserDto } from '@packages/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWorkspace, listWorkspaces } from '@/entities/workspace';
import { ROUTES } from '@/shared/config';
import { I18nProvider } from '@/shared/i18n';

import { workspaceKeys } from '../model/queries';
import { WorkspaceDetails } from './workspace-details';
import { WorkspaceList } from './workspace-list';

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let client: QueryClient;
let actor: AuthUserDto;

beforeEach(() => {
  sessionStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  actor = { id: crypto.randomUUID(), username: 'Ada', email: 'ada@example.com', avatarUrl: null };
  client.setQueryData(getAuthProfileQueryKey(), actor);
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
    };
  }
});

afterEach(() => {
  cleanup();
  client.clear();
});

function renderWorkspace(children: ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider initialLocale="ru">{children}</I18nProvider>
    </QueryClientProvider>,
  );
}

describe('workspace profile', () => {
  it('filters workspaces and validates, creates, edits and confirms deletion from the profile', async () => {
    const user = userEvent.setup();
    renderWorkspace(<WorkspaceList />);
    expect(await screen.findByRole('heading', { name: 'Analog Studio' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Участие' }), 'joined');
    expect(screen.queryByRole('heading', { name: 'Analog Studio' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Platform' })).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'missing');
    expect(screen.getByText('По вашему запросу ничего не найдено')).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Участие' }), 'all');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Сортировка' }), 'oldest');
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Analog Studio');

    const create = screen.getByRole('button', { name: 'Создать workspace' });
    await user.click(create);
    const form = within(screen.getByRole('dialog', { name: 'Создать workspace' }));
    await user.click(form.getByRole('button', { name: 'Сохранить' }));
    expect(await form.findByText('Введите название длиной до 150 символов')).toBeInTheDocument();
    await user.type(form.getByLabelText('Название'), 'New Workspace');
    const slug = form.getByLabelText('Slug');
    await user.type(slug, 'analog-studio');
    await user.click(form.getByRole('button', { name: 'Сохранить' }));
    expect(
      await form.findByText('Рабочее пространство с таким slug уже существует'),
    ).toBeInTheDocument();
    await user.clear(slug);
    await user.type(slug, 'new-workspace');
    await user.click(form.getByRole('button', { name: 'Сохранить' }));
    const heading = await screen.findByRole('heading', { name: 'New Workspace' });
    expect(create).toHaveFocus();

    const card = within(heading.closest('li')!);
    const created = (await listWorkspaces(actor)).find(
      (workspace) => workspace.slug === 'new-workspace',
    );
    expect(card.getByRole('link', { name: 'Открыть' })).toHaveAttribute(
      'href',
      ROUTES.WORKSPACE(created!.id),
    );
    await user.click(card.getByRole('button', { name: 'Изменить' }));
    const edit = within(screen.getByRole('dialog', { name: 'Изменить workspace' }));
    const name = edit.getByLabelText('Название');
    await user.clear(name);
    await user.type(name, 'Renamed');
    await user.click(edit.getByRole('button', { name: 'Сохранить' }));
    expect(await card.findByRole('heading', { name: 'Renamed' })).toBeInTheDocument();

    await user.click(card.getByRole('button', { name: 'Удалить' }));
    const confirmation = within(screen.getByRole('dialog', { name: 'Удалить workspace' }));
    expect(confirmation.getByRole('button', { name: 'Отмена' })).toHaveFocus();
    await user.click(confirmation.getByRole('button', { name: 'Удалить' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Renamed' })).not.toBeInTheDocument(),
    );
  });

  it('renders the empty profile with a creation action', () => {
    client.setQueryDefaults(workspaceKeys.all(actor.id), { staleTime: Infinity });
    client.setQueryData(workspaceKeys.list(actor.id), []);
    renderWorkspace(<WorkspaceList />);
    expect(screen.getByRole('button', { name: 'Создать первый workspace' })).toBeInTheDocument();
  });

  it('shows a loading state and allows loading to be retried after an error', async () => {
    const user = userEvent.setup();
    let offline = true;
    client.setQueryDefaults(workspaceKeys.all(actor.id), {
      persister: (queryFn, context) =>
        offline ? Promise.reject(new Error('Offline')) : queryFn(context),
    });
    renderWorkspace(<WorkspaceList />);
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем рабочие пространства');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось загрузить данные рабочего пространства',
    );
    offline = false;
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Analog Studio' })).toBeInTheDocument();
  });
});

describe('workspace detail', () => {
  it('creates and removes a project and adds a pending invitation', async () => {
    const user = userEvent.setup();
    const workspace = await createWorkspace(actor, { name: 'New team', slug: 'new-team' });
    renderWorkspace(<WorkspaceDetails id={workspace.id} />);
    expect(await screen.findByText('В пространстве пока нет проектов')).toBeInTheDocument();
    expect(screen.getByText('В пространстве пока нет других участников')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Создать проект' }));
    const project = within(screen.getByRole('dialog', { name: 'Создать проект' }));
    await user.type(project.getByLabelText('Название'), 'New Project');
    await user.type(project.getByLabelText('Описание'), 'Release planning');
    await user.click(project.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText('Release planning')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New Project' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Удалить проект' }));
    const confirm = within(screen.getByRole('dialog', { name: 'Удалить проект' }));
    await user.click(confirm.getByRole('button', { name: 'Удалить' }));
    expect(await screen.findByText('В пространстве пока нет проектов')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Пригласить' }));
    const invite = within(screen.getByRole('dialog', { name: 'Пригласить' }));
    await user.type(invite.getByLabelText('Почта'), 'new@example.com');
    await user.click(invite.getByRole('button', { name: 'Пригласить' }));
    expect(await screen.findByText('new@example.com')).toBeInTheDocument();
    expect(screen.getByText('Ожидает принятия')).toBeInTheDocument();
  });

  it('lets the owner change a member role and remove the member', async () => {
    const user = userEvent.setup();
    const workspace = (await listWorkspaces(actor)).find((item) => item.access === 'owner')!;
    renderWorkspace(<WorkspaceDetails id={workspace.id} />);
    const volunteer = await screen.findByText('Sam Lee');
    const row = within(volunteer.closest('li')!);
    await user.click(row.getByRole('button', { name: 'Изменить роль' }));
    const change = within(screen.getByRole('dialog', { name: 'Изменить роль' }));
    await user.selectOptions(change.getByRole('combobox', { name: 'Роль' }), 'admin');
    await user.click(change.getByRole('button', { name: 'Сохранить' }));
    expect(await row.findByText('Администратор')).toBeInTheDocument();

    await user.click(row.getByRole('button', { name: 'Удалить из workspace' }));
    const confirm = within(screen.getByRole('dialog', { name: 'Удалить из workspace' }));
    await user.click(confirm.getByRole('button', { name: 'Удалить' }));
    await waitFor(() => expect(screen.queryByText('Sam Lee')).not.toBeInTheDocument());
  });

  it('hides management controls from members', async () => {
    const workspace = (await listWorkspaces(actor)).find((item) => item.access === 'member')!;
    renderWorkspace(<WorkspaceDetails id={workspace.id} />);
    expect(await screen.findByRole('heading', { name: 'Community' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
