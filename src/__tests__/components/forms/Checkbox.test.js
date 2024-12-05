import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Checkbox from '../../../components/forms/Checkbox';

describe('Checkbox Component', () => {
  it('renders correctly', () => {
    render(<Checkbox label="Test Checkbox" />);
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
  });

  it('handles checked state correctly', () => {
    const handleChange = jest.fn();
    render(
      <Checkbox
        label="Test Checkbox"
        checked={false}
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error state correctly', () => {
    render(
      <Checkbox
        label="Test Checkbox"
        error
        helperText="Error message"
      />
    );
    expect(screen.getByText('Error message')).toHaveStyle({
      color: expect.stringContaining('error')
    });
  });

  it('handles disabled state correctly', () => {
    render(<Checkbox label="Test Checkbox" disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('applies custom color correctly', () => {
    render(
      <Checkbox
        label="Test Checkbox"
        checked
        color="secondary"
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('Mui-checked');
  });
}); 