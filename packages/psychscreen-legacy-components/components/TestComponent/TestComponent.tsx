import React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';

export interface TestComponentProps {
  variant?: ButtonProps['variant'];
}

export function TestComponent({ variant }: TestComponentProps) {
  const handleClick = () => {
    window.alert('Button was clicked!');
  };

  return (
    <Button variant={variant} onClick={handleClick}>
      Click Me
    </Button>
  );
}