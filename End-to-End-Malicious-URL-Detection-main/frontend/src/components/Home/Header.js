import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { RiShieldCheckFill, RiGithubFill } from 'react-icons/ri';
import { ColorModeSwitcher } from '../../ColorModeSwitcher';

const Header = () => {
  const glassBg = useColorModeValue(
    'rgba(255, 255, 255, 0.15)',
    'rgba(10, 24, 52, 0.65)'
  );
  const borderColor = useColorModeValue(
    'rgba(255, 255, 255, 0.3)',
    'rgba(56, 189, 248, 0.22)'
  );

  return (
    <Flex
      as="header"
      width="100%"
      py={3}
      px={[4, 6]}
      borderRadius="full"
      bg={glassBg}
      backdropFilter="blur(24px) saturate(180%)"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="0 12px 35px -8px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15)"
      alignItems="center"
      justifyContent="space-between"
      mb={[6, 8]}
      transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
    >
      {/* Brand Identity */}
      <HStack spacing={3} alignItems="center">
        <Flex
          w="38px"
          h="38px"
          borderRadius="xl"
          bg="linear-gradient(135deg, #0284c7 0%, #6366f1 100%)"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 0 20px rgba(14, 165, 233, 0.45)"
          position="relative"
        >
          <RiShieldCheckFill size={22} color="white" />
          <Box
            position="absolute"
            top="-1px"
            right="-1px"
            w="8px"
            h="8px"
            borderRadius="full"
            bg="#10b981"
            boxShadow="0 0 6px #10b981"
            className="beacon-pulse"
          />
        </Flex>

        <HStack spacing={2} align="baseline">
          <Text
            fontSize="xl"
            fontWeight="900"
            letterSpacing="-0.5px"
            bgGradient="linear(to-r, #ffffff, #bae6fd, #38bdf8)"
            bgClip="text"
            lineHeight="1"
          >
            MASK
          </Text>
          <Text
            fontSize="xs"
            fontWeight="700"
            color="gray.300"
            letterSpacing="1px"
            textTransform="uppercase"
            display={['none', 'inline']}
          >
            Malicious URL Detection
          </Text>
          <Badge
            variant="solid"
            bg="linear-gradient(135deg, #0284c7 0%, #2563eb 100%)"
            color="white"
            fontSize="3xs"
            px={2}
            py={0.5}
            borderRadius="full"
            display={['none', 'inline']}
          >
            PRO
          </Badge>
        </HStack>
      </HStack>

      {/* Center Live Shield Status */}
      <HStack
        spacing={2}
        px={3.5}
        py={1}
        borderRadius="full"
        bg="rgba(16, 185, 129, 0.12)"
        border="1px solid rgba(16, 185, 129, 0.35)"
        display={['none', 'flex']}
      >
        <Box
          w="7px"
          h="7px"
          borderRadius="full"
          bg="#10b981"
          boxShadow="0 0 8px #10b981"
          className="beacon-pulse"
        />
        <Text fontSize="xs" fontWeight="700" color="#34d399" letterSpacing="0.3px">
          Autonomous Neural Shield Active
        </Text>
      </HStack>

      {/* Right Controls */}
      <HStack spacing={2.5}>
        <Tooltip label="View GitHub Repository" placement="bottom">
          <Box
            as="a"
            href="https://github.com/Mayur-Murarka/End-to-End-Malicious-URL-Detection-main"
            target="_blank"
            rel="noopener noreferrer"
            p={2}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.06)"
            border="1px solid rgba(255, 255, 255, 0.12)"
            color="gray.300"
            transition="all 0.2s"
            _hover={{ bg: 'rgba(255, 255, 255, 0.15)', color: 'white', transform: 'translateY(-1px)' }}
            display={['none', 'flex']}
          >
            <RiGithubFill size={18} />
          </Box>
        </Tooltip>

        <Tooltip label="Toggle Dark / Light Theme" placement="bottom">
          <Box
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.06)"
            border="1px solid rgba(255, 255, 255, 0.12)"
            transition="all 0.2s"
            _hover={{ bg: 'rgba(255, 255, 255, 0.15)', borderColor: 'cyan.400' }}
          >
            <ColorModeSwitcher
              color="white"
              variant="ghost"
              _hover={{ bg: 'transparent' }}
              size="sm"
            />
          </Box>
        </Tooltip>
      </HStack>
    </Flex>
  );
};

export default Header;