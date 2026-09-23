import React, { useState, useEffect } from 'react';
import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { RiRadarLine } from 'react-icons/ri';

const SCAN_STEPS = [
  'Deconstructing URL lexical & structural tree...',
  'Computing Shannon entropy & obfuscation indices...',
  'Auditing SSL/TLS certificate & ASN infrastructure...',
  'Checking 8 threat intelligence consensus feeds...',
  'Synthesizing MASK neural threat classification...',
];

function Loader() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 650);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      py={9}
      px={8}
      borderRadius="24px"
      bg="rgba(8, 20, 42, 0.78)"
      backdropFilter="blur(24px) saturate(180%)"
      border="1.5px solid rgba(56, 189, 248, 0.35)"
      boxShadow="0 20px 60px -10px rgba(0, 0, 0, 0.7), 0 0 40px rgba(14, 165, 233, 0.25)"
      textAlign="center"
      maxW="480px"
      w="100%"
      position="relative"
      overflow="hidden"
    >
      {/* Top subtle glow line */}
      <Box
        position="absolute"
        top="0"
        left="15%"
        right="15%"
        h="2px"
        bg="linear-gradient(90deg, transparent, #38bdf8, transparent)"
      />

      <VStack spacing={5}>
        {/* Holographic Radar Scanner */}
        <Box position="relative" width="90px" height="90px" display="flex" alignItems="center" justifyContent="center">
          {/* Outer ring with pulse */}
          <Box
            position="absolute"
            w="90px"
            h="90px"
            borderRadius="full"
            border="1.5px dashed rgba(56, 189, 248, 0.35)"
            className="beacon-pulse"
          />

          {/* Middle rotating ring */}
          <Box
            position="absolute"
            w="70px"
            h="70px"
            borderRadius="full"
            border="1.5px solid rgba(56, 189, 248, 0.2)"
            borderTopColor="#38bdf8"
            className="radar-sweep-beam"
          />

          {/* Inner core radar icon */}
          <Flex
            position="absolute"
            w="50px"
            h="50px"
            borderRadius="full"
            bg="rgba(14, 165, 233, 0.15)"
            border="1px solid rgba(56, 189, 248, 0.4)"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 0 20px rgba(56, 189, 248, 0.4)"
          >
            <RiRadarLine size={26} color="#38bdf8" />
          </Flex>
        </Box>

        <VStack spacing={1.5}>
          <Text
            fontSize="sm"
            fontWeight="800"
            letterSpacing="1.5px"
            bgGradient="linear(to-r, #ffffff, #93c5fd, #38bdf8)"
            bgClip="text"
            textTransform="uppercase"
          >
            MASK THREAT SCANNER
          </Text>
          <Text
            fontSize="xs"
            color="cyan.200"
            fontFamily="mono"
            minH="20px"
            transition="all 0.3s ease"
          >
            {SCAN_STEPS[stepIdx]}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}

export default Loader;
