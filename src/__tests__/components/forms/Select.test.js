import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Select from '../../../components/forms/Select';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' }
];

describe('Select Component', () => {
  it('renders correctly', () => {
    render(<Select label="Test Select" options={options} />);
    expect(screen.getByText('Test Select')).toBeInTheDocument();
  });

  it('shows required asterisk when required prop is true', () => {
    render(<Select label="Test Select" options={options} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error state correctly', () => {
    render(
      <Select
        label="Test Select"
        options={options}
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
      <Select
        label="Test Select"
        options={options}
        value="1"
        onChange={handleChange}
      />
    );

    const select = screen.getByRole('button');
    fireEvent.mouseDown(select);
    
    const option = screen.getByText('Option 2');
    fireEvent.click(option);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders all options correctly', () => {
    render(<Select label="Test Select" options={options} />);
    
    const select = screen.getByRole('button');
    fireEvent.mouseDown(select);
    
    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });
}); 