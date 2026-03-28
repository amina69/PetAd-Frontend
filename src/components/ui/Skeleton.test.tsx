import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders a single skeleton by default', () => {
    render(<Skeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(1);
    expect(skeletons[0].className).toContain('animate-shimmer');
    expect(skeletons[0].className).toContain('h-4 w-full'); // 'text' variant is default
  });

  it('renders correct number of lines with decreasing widths', () => {
    render(<Skeleton lines={3} />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(3);
    
    // Check elements for correct width assignments via inline styles
    expect(skeletons[0].style.width).toBe('100%');
    expect(skeletons[1].style.width).toBe('80%');
    expect(skeletons[2].style.width).toBe('60%');
  });

  it('applies correct variant class for card', () => {
    render(<Skeleton variant="card" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.className).toContain('h-32 w-full rounded-xl');
  });

  it('applies correct variant class for row', () => {
    render(<Skeleton variant="row" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.className).toContain('h-12 w-full rounded-none');
  });

  it('applies custom width and height styles correctly', () => {
    render(<Skeleton width="45px" height="120px" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.style.width).toBe('45px');
    expect(skeleton.style.height).toBe('120px');
  });
});
