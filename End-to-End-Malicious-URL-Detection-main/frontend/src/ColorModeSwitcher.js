import React from 'react';
import { useColorMode, useColorModeValue, IconButton } from '@chakra-ui/react';
import { FaMoon, FaSun } from 'react-icons/fa';

export function ColorModeSwitcher(props) {
  const { toggleColorMode } = useColorMode();
  const text = useColorModeValue('light', 'dark');
  const SwitchIcon = useColorModeValue(FaSun, FaMoon);

  return (
    <IconButton
      icon={<SwitchIcon />}
      aria-label={`Switch to ${text} mode`}
      onClick={toggleColorMode}
      {...props}
    />
  );
}
