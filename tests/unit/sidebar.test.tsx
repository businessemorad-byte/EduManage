import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { Sidebar } from '@/components/dashboard/sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/students',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe('Sidebar', () => {
  const props = {
    userName: 'Test User',
    userEmail: 'test@example.com',
    isPlatformOwner: false,
  };

  it('should render sidebar navigation items', () => {
    const { rerender } = render(<Sidebar {...props} />);

    expect(screen.getByText('Élèves')).toBeInTheDocument();
    expect(screen.getByText('Enseignants')).toBeInTheDocument();
    expect(screen.getByText('Parents')).toBeInTheDocument();
    expect(screen.getByText('Prospects')).toBeInTheDocument();
  });

  it('should not show platform-only items for non-platform owners', () => {
    const { rerender } = render(<Sidebar {...props} />);

    expect(screen.queryByText('Plateforme')).not.toBeInTheDocument();
    expect(screen.queryByText('Facturation')).not.toBeInTheDocument();
  });
});