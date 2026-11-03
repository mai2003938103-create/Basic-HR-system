import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { SidebarNav } from './Sidebar';
import { DataTable } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { useListQuery } from '../../hooks/useListQuery';
import { NAV_ITEMS } from '../../lib/permissions';

const canFor = (perms: string[]) => (p: string) => perms.includes(p);
const keysShown = () => screen.getAllByRole('link').map((a) => a.getAttribute('data-key'));

describe('SidebarNav', () => {
  it('shows only permitted items per role', () => {
    const { unmount } = render(<MemoryRouter><SidebarNav can={canFor(['attendance.check', 'attendance.read', 'leave.read', 'leave.request'])} /></MemoryRouter>);
    expect(keysShown()).toEqual(['attendance', 'leave', 'profile']);
    unmount();
    render(
      <MemoryRouter>
        <SidebarNav can={canFor(['employee.read', 'department.read', 'position.read', 'attendance.read', 'attendance.check', 'leave.read', 'leave.request', 'leave.approve', 'dashboard.view'])} />
      </MemoryRouter>,
    );
    expect(keysShown()).toEqual(['dashboard', 'employees', 'departments', 'positions', 'attendance', 'leave', 'profile']);
  });

  it('shows every Stage 1 item to a super admin', () => {
    render(<MemoryRouter><SidebarNav can={() => true} /></MemoryRouter>);
    expect(keysShown()).toEqual(NAV_ITEMS.map((i) => i.key));
  });
});

type Row = { id: string; name: string };
const columns = [{ key: 'name', header: 'Name', sortable: true, cell: (r: Row) => r.name }];
const params = { page: 1, pageSize: 20, sort: 'code:asc' };

describe('DataTable', () => {
  it('renders loading, empty and error states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<DataTable<Row> columns={columns} rows={[]} total={0} params={params} loading onSortChange={() => {}} onPageChange={() => {}} emptyTitle="Nothing" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<DataTable<Row> columns={columns} rows={[]} total={0} params={params} loading={false} onSortChange={() => {}} onPageChange={() => {}} emptyTitle="Nothing" />);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    rerender(<DataTable<Row> columns={columns} rows={[]} total={0} params={params} loading={false} error={new Error('x')} onRetry={onRetry} onSortChange={() => {}} onPageChange={() => {}} emptyTitle="Nothing" />);
    await userEvent.click(screen.getByRole('button', { name: 'ລອງໃໝ່' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('toggles sort direction on a sortable header', async () => {
    const onSort = vi.fn();
    const rows = [{ id: '1', name: 'A' }];
    const { rerender } = render(<DataTable<Row> columns={columns} rows={rows} total={1} params={params} loading={false} onSortChange={onSort} onPageChange={() => {}} emptyTitle="-" />);
    const table = screen.getByRole('table');
    await userEvent.click(within(table).getByRole('button', { name: /Name/ }));
    expect(onSort).toHaveBeenLastCalledWith('name:asc');
    rerender(<DataTable<Row> columns={columns} rows={rows} total={1} params={{ ...params, sort: 'name:asc' }} loading={false} onSortChange={onSort} onPageChange={() => {}} emptyTitle="-" />);
    await userEvent.click(within(screen.getByRole('table')).getByRole('button', { name: /Name/ }));
    expect(onSort).toHaveBeenLastCalledWith('name:desc');
  });
});

describe('StatusBadge', () => {
  it('renders the Lao word with warning colours for late', () => {
    render(<StatusBadge kind="attendance" value="late" />);
    const el = screen.getByText('ມາຊ້າ');
    expect(el.className).toContain('bg-warning-tint');
    expect(el.className).toContain('text-warning-text');
  });
});

describe('ConfirmDialog', () => {
  it('requires a reason before confirming when asked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmDialog open title="Reject" confirmLabel="Reject" tone="danger" requireReason onConfirm={onConfirm} onOpenChange={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Reject' });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), 'busy');
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledWith('busy');
  });
});

function ListProbe() {
  const q = useListQuery({ sort: 'name:asc' });
  const loc = useLocation();
  return (
    <div>
      <button onClick={() => q.setPage(2)}>p2</button>
      <button onClick={() => q.setSearch('x')}>s</button>
      <span data-testid="url">{loc.search}</span>
      <span data-testid="page">{q.params.page}</span>
    </div>
  );
}

describe('useListQuery', () => {
  it('keeps paging and search in the URL', async () => {
    render(<MemoryRouter><ListProbe /></MemoryRouter>);
    await userEvent.click(screen.getByText('p2'));
    expect(screen.getByTestId('url').textContent).toContain('page=2');
    await userEvent.click(screen.getByText('s'));
    await waitFor(() => expect(screen.getByTestId('url').textContent).toContain('search=x'));
    expect(screen.getByTestId('page')).toHaveTextContent('1');
  });
});
