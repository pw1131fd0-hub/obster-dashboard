import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

describe('Footer', () => {
  it('renders the footer element', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays the version string', () => {
    render(<Footer />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('mentions Docker Container', () => {
    render(<Footer />);
    expect(screen.getByText(/Docker Container/)).toBeInTheDocument();
  });
});
