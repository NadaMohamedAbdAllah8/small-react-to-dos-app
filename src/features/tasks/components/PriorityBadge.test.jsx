import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PriorityBadge from './PriorityBadge';

describe('PriorityBadge', () => {
  it.each([
    ['low', 'LOW'],
    ['medium', 'MEDIUM'],
    ['high', 'HIGH'],
  ])('renders the visible label for %s priority', (priority, label) => {
    render(<PriorityBadge priority={priority} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
