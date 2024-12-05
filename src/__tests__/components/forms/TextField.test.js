import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import TextField from '../../../components/forms/TextField';

describe('TextField Component', () => {
  it('renders correctly', () => {
    render(<TextField label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('shows required asterisk when required prop is true', () => {
    render(<TextField label="Test Label" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error state correctly', () => {
    render(
      <TextField
        label="Test Label"
        error
        helperText="Error message"
      />
    );
    expect(screen.getByText('Error message')).toHaveStyle({
      color: expect.stringContaining('error')
    });
  });

  it('handles value changes correctly', () => {
    const handleChange = jest.fn();
    render(
      <TextField
        label="Test Label"
        value="initial value"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with start and end icons', () => {
    const StartIcon = () => <span>Start</span>;
    const EndIcon = () => <span>End</span>;

    render(
      <TextField
        label="Test Label"
        startIcon={<StartIcon />}
        endIcon={<EndIcon />}
      />
    );

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });
}); 