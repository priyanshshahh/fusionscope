import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataSourceBadge } from '@/components/DataSourceBadge';

describe('DataSourceBadge', () => {
  it('shows LIVE only for live data', () => {
    render(<DataSourceBadge status="live" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('labels demo data honestly', () => {
    render(<DataSourceBadge status="demo" />);
    expect(screen.getByText('DEMO DATA')).toBeInTheDocument();
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('labels offline fallback honestly', () => {
    render(<DataSourceBadge status="offline" />);
    expect(screen.getByText(/OFFLINE/)).toBeInTheDocument();
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });
});
