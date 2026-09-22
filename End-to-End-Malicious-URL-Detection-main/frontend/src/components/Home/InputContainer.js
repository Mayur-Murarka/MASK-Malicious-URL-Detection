import React, { useState } from 'react';
import {
  Input,
  Stack,
  InputGroup,
  InputLeftElement,
  Button,
  Box,
  Text,
  Badge,
  Flex,
  Progress,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdOutlineHttp, MdSecurity, MdWarning, MdError, MdCheckCircle } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { predictURL } from '../../Utils/APIs';
import { classifyUrlLocally } from '../../Utils/urlClassifier';
import './style.css';
import Loader from './Loader';

function InputContainer() {
  const toastOptions = {
    position: 'bottom-right',
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: 'dark',
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const statBoxBg = useColorModeValue('gray.50', 'gray.700');

  const [url, setUrl] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setUrl(e.target.value);
  };

  const handleURL = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error('Please enter a valid URL to analyze', toastOptions);
      return;
    }

    try {
      setLoading(true);
      let data = null;

      try {
        // Attempt backend API call with 3500ms timeout
        const response = await axios.post(
          predictURL,
          { url: trimmedUrl },
          { timeout: 3500 }
        );
        if (response.data && response.data.prediction) {
          data = {
            prediction: response.data.prediction.toLowerCase(),
            confidence: response.data.confidence || 0.95,
            probabilities: response.data.probabilities || null,
            source: 'cloud-api',
          };
        }
      } catch (networkError) {
        // Backend unavailable or offline - seamlessly switch to local ML engine
        console.warn('Backend API unavailable, using built-in model engine:', networkError.message);
      }

      // If backend didn't provide data, evaluate with client ML engine
      if (!data) {
        data = classifyUrlLocally(trimmedUrl);
      }

      setResultData(data);
      setLoading(false);

      if (data.prediction === 'benign') {
        toast.success('URL verified: Safe (Benign)', toastOptions);
      } else {
        toast.warn(`Threat detected: ${data.prediction.toUpperCase()}`, toastOptions);
      }
    } catch (err) {
      console.error('Classification error:', err);
      // Failsafe fallback
      const fallback = classifyUrlLocally(trimmedUrl);
      setResultData(fallback);
      setLoading(false);
    }
  };

  const getBadgeScheme = (prediction) => {
    switch (prediction) {
      case 'benign':
        return { colorScheme: 'green', label: 'SAFE / BENIGN', icon: MdCheckCircle, color: '#38A169' };
      case 'phishing':
        return { colorScheme: 'orange', label: 'PHISHING', icon: MdWarning, color: '#DD6B20' };
      case 'malware':
        return { colorScheme: 'red', label: 'MALWARE', icon: MdError, color: '#E53E3E' };
      case 'defacement':
        return { colorScheme: 'purple', label: 'DEFACEMENT', icon: MdSecurity, color: '#805AD5' };
      default:
        return { colorScheme: 'gray', label: prediction?.toUpperCase(), icon: MdSecurity, color: '#718096' };
    }
  };

  const badgeInfo = resultData ? getBadgeScheme(resultData.prediction) : null;
  const BadgeIcon = badgeInfo ? badgeInfo.icon : null;

  return (
    <>
      <Stack
        direction={['column', 'column']}
        spacing={8}
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        maxW="800px"
        margin="0 auto"
      >
        <InputGroup size="lg" display="flex" gap={4}>
          <InputLeftElement
            pointerEvents="none"
            children={<MdOutlineHttp color="gray.400" size="28px" />}
          />
          <Input
            className="inp"
            type="text"
            value={url}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleURL(e)}
            name="url"
            id="url"
            size="lg"
            placeholder="Enter or paste any URL here (e.g. https://example.com)..."
            colorScheme="blue"
            focusBorderColor="blue.500"
            borderRadius="md"
          />
        </InputGroup>

        <Button
          onClick={handleURL}
          colorScheme="blue"
          size="lg"
          px={10}
          isLoading={loading}
          loadingText="Analyzing URL..."
        >
          Scan URL
        </Button>

        {loading && <Loader />}

        {!loading && resultData && (
          <Box
            width="100%"
            p={6}
            borderRadius="xl"
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            boxShadow="xl"
            transition="all 0.3s ease"
          >
            <Flex
              direction={['column', 'row']}
              alignItems={['flex-start', 'center']}
              justifyContent="space-between"
              mb={4}
              gap={3}
            >
              <Flex alignItems="center" gap={2}>
                {BadgeIcon && <BadgeIcon size="32px" color={badgeInfo.color} />}
                <Box>
                  <Text fontSize="sm" color="gray.500" fontWeight="bold">
                    PREDICTION RESULT
                  </Text>
                  <Badge
                    colorScheme={badgeInfo.colorScheme}
                    fontSize={['md', 'xl']}
                    px={3}
                    py={1}
                    borderRadius="md"
                  >
                    {badgeInfo.label}
                  </Badge>
                </Box>
              </Flex>

              <Box textAlign={['left', 'right']}>
                <Text fontSize="sm" color="gray.500">
                  Confidence Score
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={badgeInfo.color}>
                  {(resultData.confidence * 100).toFixed(1)}%
                </Text>
              </Box>
            </Flex>

            {resultData.probabilities && (
              <Box mt={4} pt={4} borderTop="1px solid" borderColor={cardBorder}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase">
                  Class Probability Distribution
                </Text>
                <SimpleGrid columns={[2, 4]} spacing={3}>
                  {Object.entries(resultData.probabilities).map(([name, prob]) => (
                    <Box key={name} p={2} bg={statBoxBg} borderRadius="md">
                      <Flex justifyContent="space-between" fontSize="xs" mb={1} textTransform="capitalize">
                        <Text color={textColor}>{name}</Text>
                        <Text fontWeight="bold">{(prob * 100).toFixed(1)}%</Text>
                      </Flex>
                      <Progress
                        value={prob * 100}
                        size="xs"
                        colorScheme={
                          name === 'benign'
                            ? 'green'
                            : name === 'phishing'
                            ? 'orange'
                            : name === 'malware'
                            ? 'red'
                            : 'purple'
                        }
                        borderRadius="full"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {resultData.metrics && (
              <Box mt={4} pt={4} borderTop="1px solid" borderColor={cardBorder}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase">
                  Extracted URL Signals
                </Text>
                <Flex wrap="wrap" gap={2}>
                  <Badge variant="subtle" colorScheme="gray">
                    Length: {resultData.metrics.url_length} chars
                  </Badge>
                  {resultData.metrics.hostname && (
                    <Badge variant="subtle" colorScheme="blue">
                      Host: {resultData.metrics.hostname}
                    </Badge>
                  )}
                  {resultData.metrics.has_ip && (
                    <Badge variant="solid" colorScheme="red">
                      IP Host Detected
                    </Badge>
                  )}
                  {resultData.metrics.is_shortened && (
                    <Badge variant="solid" colorScheme="orange">
                      Shortened URL
                    </Badge>
                  )}
                  {resultData.metrics.suspicious_words && (
                    <Badge variant="solid" colorScheme="red">
                      Suspicious Keywords Found
                    </Badge>
                  )}
                  <Badge variant="outline" colorScheme="green">
                    Engine: {resultData.source}
                  </Badge>
                </Flex>
              </Box>
            )}
          </Box>
        )}
      </Stack>
      <ToastContainer />
    </>
  );
}

export default InputContainer;
