import React from 'react';
import { Container, Box } from '@chakra-ui/react';
import Header from './Header';
import InputContainer from './InputContainer';

function Home() {
  return (
    <Container maxW="1180px" px={[4, 6]} py={[5, 8]}>
      <Header />
      <Box mt={[3, 5]}>
        <InputContainer />
      </Box>
    </Container>
  );
}

export default Home;
