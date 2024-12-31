import React from 'react';
import { Box } from '@chakra-ui/react';
import ghost from '../../assets/ghost2.gif';

function Loader() {
  return (
    <Box width={['300px', '300px']} height={['300px', '300px']}>
      <img src={ghost} alt="Loading" />
    </Box>
  );
}

export default Loader;
