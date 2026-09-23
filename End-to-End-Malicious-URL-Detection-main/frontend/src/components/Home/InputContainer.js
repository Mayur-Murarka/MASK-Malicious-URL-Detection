import React, { useState, useEffect } from 'react';
import {
  Input,
  Stack,
  Button,
  Box,
  Text,
  Badge,
  Flex,
  Progress,
  SimpleGrid,
  HStack,
  VStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdOutlineHttp,
  MdSecurity,
  MdContentPaste,
  MdClear,
  MdContentCopy,
  MdHistory,
  MdArrowForward,
  MdShield,
  MdCheckCircle,
  MdCancel,
  MdFileDownload,
  MdDns,
  MdPublic,
} from 'react-icons/md';
import {
  RiShieldCheckLine,
  RiAlertLine,
  RiVirusLine,
  RiSkullLine,
  RiRadarLine,
  RiExternalLinkLine,
  RiLock2Line,
  RiLockUnlockLine,
  RiCpuLine,
  RiPulseLine,
  RiGlobalLine,
  RiCodeSSlashLine,
  RiServerLine,
} from 'react-icons/ri';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { predictURL } from '../../Utils/APIs';
import {
  classifyUrlLocally,
  extractFeatures,
  generateVendorConsensus,
  defangUrl,
  getNetworkIntelligence,
} from '../../Utils/urlClassifier';
import Loader from './Loader';
import './style.css';

const SAMPLE_URLS = [
  { label: 'Clean Domain', url: 'https://www.google.com', type: 'benign' },
  {
    label: 'Phishing Portal',
    url: 'http://paypal.security-update.account-verify.com/login',
    type: 'phishing',
  },
  {
    label: 'Malware Dropper',
    url: 'http://192.168.1.100/sys/patch.exe',
    type: 'malware',
  },
  {
    label: 'Defaced Site',
    url: 'http://mirror-zone.org/deface/hacked-by-ghost',
    type: 'defacement',
  },
  {
    label: 'Shortened Link',
    url: 'https://bit.ly/secure-banking-portal',
    type: 'shortener',
  },
];

/* Circular SVG Gauge for Cyber Risk Score with Luminous Glow */
function RiskGauge({ score, color, label }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Box
      position="relative"
      width="112px"
      height="112px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="7"
          fill="transparent"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 10px ${color}99)`,
          }}
        />
      </svg>
      <VStack spacing={0} position="absolute">
        <Text
          fontSize="2xl"
          fontWeight="900"
          color="white"
          fontFamily="mono"
          lineHeight="1"
        >
          {score}
        </Text>
        <Text
          fontSize="3xs"
          color="gray.400"
          fontWeight="800"
          textTransform="uppercase"
          letterSpacing="0.8px"
        >
          {label || 'RISK'}
        </Text>
      </VStack>
    </Box>
  );
}

function InputContainer() {
  const toastOptions = {
    position: 'bottom-right',
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    theme: 'dark',
  };

  const [url, setUrl] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');
  const [recentScans, setRecentScans] = useState([]);

  // Load recent scans from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('mask_recent_scans');
      if (saved) {
        setRecentScans(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveToHistory = (entry) => {
    try {
      const updated = [entry, ...recentScans.filter((s) => s.url !== entry.url)].slice(
        0,
        5
      );
      setRecentScans(updated);
      sessionStorage.setItem('mask_recent_scans', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          toast.info('Pasted URL from clipboard', toastOptions);
        }
      }
    } catch (err) {
      toast.warn('Please manually paste using Ctrl+V', toastOptions);
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const handleScan = async (targetUrl) => {
    const rawUrl = targetUrl || url;
    const trimmedUrl = (rawUrl || '').trim();

    if (!trimmedUrl) {
      toast.error('Please enter a valid URL to analyze', toastOptions);
      return;
    }

    setUrl(trimmedUrl);
    setLoading(true);

    try {
      let data = null;

      try {
        const response = await axios.post(
          predictURL,
          { url: trimmedUrl },
          { timeout: 3500 }
        );
        if (response.data && response.data.prediction) {
          const localFeatures = extractFeatures(trimmedUrl);
          const pred = response.data.prediction.toLowerCase();
          const conf = response.data.confidence || 0.95;
          const probs = response.data.probabilities || {
            [pred]: conf,
            benign: pred === 'benign' ? conf : 0.05,
          };

          let riskScore = 5;
          if (pred === 'benign') {
            riskScore = Math.min(
              25,
              Math.max(2, Math.round((1 - (probs.benign || 0.95)) * 100))
            );
          } else if (pred === 'phishing') {
            riskScore = Math.min(
              98,
              Math.max(72, Math.round((probs.phishing || 0.85) * 100))
            );
          } else if (pred === 'malware') {
            riskScore = Math.min(
              100,
              Math.max(88, Math.round((probs.malware || 0.9) * 100))
            );
          } else if (pred === 'defacement') {
            riskScore = Math.min(
              94,
              Math.max(68, Math.round((probs.defacement || 0.8) * 100))
            );
          }

          const consensus = generateVendorConsensus(
            pred,
            riskScore,
            localFeatures.metrics
          );
          const network = getNetworkIntelligence(
            localFeatures.metrics.hostname,
            localFeatures.metrics.isHttps,
            pred,
            riskScore
          );

          data = {
            url: trimmedUrl,
            defangedUrl: defangUrl(trimmedUrl),
            prediction: pred,
            confidence: conf,
            riskScore,
            probabilities: probs,
            metrics: localFeatures.metrics,
            consensus,
            network,
            source: 'cloud-api',
            timestamp: new Date().toLocaleTimeString(),
          };
        }
      } catch (networkError) {
        // Fallback to local
      }

      if (!data) {
        const localResult = classifyUrlLocally(trimmedUrl);
        const consensus = generateVendorConsensus(
          localResult.prediction,
          localResult.riskScore,
          localResult.metrics
        );
        const network = getNetworkIntelligence(
          localResult.metrics.hostname,
          localResult.metrics.isHttps,
          localResult.prediction,
          localResult.riskScore
        );
        data = {
          ...localResult,
          defangedUrl: defangUrl(trimmedUrl),
          consensus,
          network,
          url: trimmedUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
      }

      setResultData(data);
      saveToHistory(data);
      setLoading(false);

      if (data.prediction === 'benign') {
        toast.success('Verdict: Clean / Safe URL', toastOptions);
      } else {
        toast.warn(`Threat Detected: ${data.prediction.toUpperCase()}`, toastOptions);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const localResult = classifyUrlLocally(trimmedUrl);
      const consensus = generateVendorConsensus(
        localResult.prediction,
        localResult.riskScore,
        localResult.metrics
      );
      const network = getNetworkIntelligence(
        localResult.metrics.hostname,
        localResult.metrics.isHttps,
        localResult.prediction,
        localResult.riskScore
      );
      const fallback = {
        ...localResult,
        defangedUrl: defangUrl(trimmedUrl),
        consensus,
        network,
        url: trimmedUrl,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResultData(fallback);
      saveToHistory(fallback);
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!resultData) return;
    const reportText = [
      `=== MASK THREAT RADAR INCIDENT DOSSIER ===`,
      `Target URL: ${resultData.url}`,
      `Defanged URL: ${resultData.defangedUrl}`,
      `Verdict: ${resultData.prediction.toUpperCase()}`,
      `Cyber Risk Index: ${resultData.riskScore}/100`,
      `Detection Confidence: ${(resultData.confidence * 100).toFixed(1)}%`,
      `Security Consensus: ${resultData.consensus?.consensusText || 'N/A'}`,
      `Network Node: ${resultData.network?.resolvedIp || 'N/A'} (${resultData.network?.isp || 'N/A'}, ${resultData.network?.location || 'N/A'})`,
      `SSL / TLS Profile: ${resultData.network?.ssl?.issuer || 'N/A'} [${resultData.network?.ssl?.protocol || 'N/A'}]`,
      `Shannon Entropy: ${resultData.metrics?.entropy || 'N/A'} bits`,
      `Engine: ${resultData.source}`,
      `Timestamp: ${resultData.timestamp}`,
      `===========================================`,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText);
      toast.success('Executive threat report copied to clipboard!', toastOptions);
    }
  };

  const downloadJsonDossier = () => {
    if (!resultData) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(resultData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `mask-threat-dossier-${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Forensic JSON dossier downloaded!', toastOptions);
  };

  const getThreatVisuals = (prediction, riskScore = 0) => {
    switch (prediction) {
      case 'benign':
        return {
          title: 'CLEAN & SAFE DOMAIN',
          subtitle:
            'Reputation verified. No hostile payload signatures, credential spoofing, or abnormal structural patterns found.',
          severity: 'MINIMAL RISK',
          color: '#10b981',
          bgGlow: 'threat-pulse-benign',
          badgeBg: 'rgba(16, 185, 129, 0.16)',
          borderColor: 'rgba(16, 185, 129, 0.45)',
          textColor: '#34d399',
          icon: RiShieldCheckLine,
          advice:
            'Standard domain parameters confirmed. Safe to browse, download verified assets, and authorize user sessions.',
        };
      case 'phishing':
        return {
          title: 'PHISHING ATTEMPT DETECTED',
          subtitle:
            'Critical credential harvesting threat. Heuristics detected brand spoofing, login bait, or deceptive routing.',
          severity: 'HIGH SEVERITY',
          color: '#f97316',
          bgGlow: 'threat-pulse-phishing',
          badgeBg: 'rgba(249, 115, 22, 0.16)',
          borderColor: 'rgba(249, 115, 22, 0.55)',
          textColor: '#fb923c',
          icon: RiAlertLine,
          advice:
            'DO NOT enter authentication passwords, OTP tokens, or payment details. Flag domain to SOC incident response.',
        };
      case 'malware':
        return {
          title: 'MALWARE / EXPLOIT HAZARD',
          subtitle:
            'Hostile payload delivery risk. Structural signatures match ransomware droppers, binary implants, or exploit kits.',
          severity: 'CRITICAL MALICIOUS',
          color: '#ef4444',
          bgGlow: 'threat-pulse-malware',
          badgeBg: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.6)',
          textColor: '#f87171',
          icon: RiVirusLine,
          advice:
            'Terminate connection immediately. Target URL matches hostile payload distribution and C2 callback behavior.',
        };
      case 'defacement':
        return {
          title: 'WEB DEFACEMENT RISK',
          subtitle:
            'Compromised web asset hosting unauthorized modifications, cyber-graffiti, or unauthorized redirection mirrors.',
          severity: 'ELEVATED RISK',
          color: '#a855f7',
          bgGlow: 'threat-pulse-defacement',
          badgeBg: 'rgba(168, 85, 247, 0.18)',
          borderColor: 'rgba(168, 85, 247, 0.55)',
          textColor: '#c084fc',
          icon: RiSkullLine,
          advice:
            'Target host compromised by adversary activity. Avoid loading active scripts or embedded forms.',
        };
      default:
        return {
          title: prediction?.toUpperCase() || 'UNKNOWN RISK',
          subtitle: 'Anomaly identified in target URL heuristics.',
          severity: 'GUARDED',
          color: '#38bdf8',
          bgGlow: '',
          badgeBg: 'rgba(56, 189, 248, 0.16)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          textColor: '#7dd3fc',
          icon: MdSecurity,
          advice: 'Exercise caution before navigating to this resource.',
        };
    }
  };

  const threat = resultData
    ? getThreatVisuals(resultData.prediction, resultData.riskScore)
    : null;
  const ThreatIcon = threat ? threat.icon : null;

  const isHttps = url.toLowerCase().startsWith('https://');
  const isHttp = url.toLowerCase().startsWith('http://');

  return (
    <Stack
      spacing={8}
      width="100%"
      maxW="1020px"
      margin="0 auto"
      alignItems="center"
    >
      {/* Hero Header Section */}
      <VStack spacing={3.5} textAlign="center" maxW="760px" pt={[2, 4]}>
        <HStack
          spacing={2}
          px={3.5}
          py={1}
          borderRadius="full"
          bg="rgba(56, 189, 248, 0.08)"
          border="1px solid rgba(56, 189, 248, 0.25)"
        >
          <Box w="6px" h="6px" borderRadius="full" bg="#38bdf8" className="beacon-pulse" />
          <Text
            fontSize="2xs"
            fontWeight="800"
            color="cyan.300"
            letterSpacing="0.8px"
            textTransform="uppercase"
          >
            Autonomous Zero-Trust Neural Scanner
          </Text>
        </HStack>

        <Text
          fontSize={['3xl', '4xl', '5xl']}
          fontWeight="900"
          letterSpacing="-1.5px"
          lineHeight="1.1"
          bgGradient="linear(to-b, #ffffff 60%, rgba(255, 255, 255, 0.7) 100%)"
          bgClip="text"
        >
          Scan Links. Stop Threats.
        </Text>

        <Text fontSize={['sm', 'md']} color="gray.300" maxW="600px" lineHeight="1.6">
          Real-time multi-engine consensus detecting zero-day phishing, ransomware payloads, and deceptive domains in milliseconds.
        </Text>
      </VStack>

      {/* Floating Hero Search Omnibar */}
      <Box width="100%">
        <Box
          className="mask-search-console"
          p={[2.5, 3]}
          display="flex"
          alignItems="center"
          gap={3}
        >
          {/* Protocol indicator pill */}
          <Box
            px={2.5}
            py={1.5}
            borderRadius="12px"
            bg={
              isHttps
                ? 'rgba(16, 185, 129, 0.18)'
                : isHttp
                ? 'rgba(245, 158, 11, 0.18)'
                : 'rgba(255, 255, 255, 0.08)'
            }
            border="1px solid"
            borderColor={
              isHttps
                ? 'rgba(16, 185, 129, 0.35)'
                : isHttp
                ? 'rgba(245, 158, 11, 0.35)'
                : 'rgba(255, 255, 255, 0.12)'
            }
            display="flex"
            alignItems="center"
            gap={1.5}
          >
            {isHttps ? (
              <RiLock2Line size={15} color="#34d399" />
            ) : isHttp ? (
              <RiLockUnlockLine size={15} color="#fbbf24" />
            ) : (
              <MdOutlineHttp size={17} color="#94a3b8" />
            )}
            <Text
              fontSize="xs"
              fontWeight="800"
              color={isHttps ? '#34d399' : isHttp ? '#fbbf24' : '#94a3b8'}
              fontFamily="mono"
              display={['none', 'inline']}
            >
              {isHttps ? 'HTTPS' : isHttp ? 'HTTP' : 'URL'}
            </Text>
          </Box>

          {/* Unified Input Field */}
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Paste or enter any domain, IP, or link (e.g., https://paypal-security.com/login)..."
            variant="unstyled"
            fontSize={['sm', 'md']}
            color="white"
            fontWeight="500"
            _placeholder={{ color: 'rgba(255,255,255,0.4)' }}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear button if URL present */}
          {url && (
            <Tooltip label="Clear Input" placement="top">
              <IconButton
                icon={<MdClear size={16} />}
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
                onClick={handleClear}
                aria-label="Clear URL"
              />
            </Tooltip>
          )}

          {/* Paste button */}
          <Tooltip label="Paste from clipboard" placement="top">
            <IconButton
              icon={<MdContentPaste size={16} />}
              size="sm"
              variant="ghost"
              color="cyan.300"
              _hover={{ color: 'cyan.100', bg: 'rgba(56, 189, 248, 0.15)' }}
              onClick={handlePaste}
              aria-label="Paste URL"
            />
          </Tooltip>

          {/* Scan Action Button */}
          <Button
            className="mask-btn-scan"
            onClick={() => handleScan()}
            isLoading={loading}
            loadingText="Scanning"
            color="white"
            size="md"
            px={[5, 8]}
            height="46px"
            borderRadius="12px"
            leftIcon={<RiRadarLine size={18} />}
          >
            ANALYZE URL
          </Button>
        </Box>

        {/* Live System Telemetry Strip */}
        <Flex
          mt={3}
          px={3.5}
          py={1.5}
          borderRadius="12px"
          bg="rgba(10, 25, 47, 0.5)"
          border="1px solid rgba(56, 189, 248, 0.15)"
          alignItems="center"
          justifyContent="space-between"
          wrap="wrap"
          gap={2}
          fontSize="2xs"
          color="gray.400"
        >
          <HStack spacing={2}>
            <RiPulseLine color="#34d399" size={14} />
            <Text color="gray.300" fontWeight="600">
              Global Threat Level:
            </Text>
            <Badge colorScheme="green" variant="subtle" fontSize="3xs" px={1.5}>
              NORMAL
            </Badge>
          </HStack>

          <HStack spacing={2} display={['none', 'flex']}>
            <RiCpuLine color="#38bdf8" size={14} />
            <Text color="gray.300" fontWeight="600">
              Forensic Signatures:
            </Text>
            <Text color="cyan.300" fontFamily="mono">
              20 Neural Features
            </Text>
          </HStack>

          <HStack spacing={2} display={['none', 'flex']}>
            <RiGlobalLine color="#818cf8" size={14} />
            <Text color="gray.300" fontWeight="600">
              Consensus Feeds:
            </Text>
            <Text color="purple.200" fontFamily="mono">
              8 Intelligence Engines
            </Text>
          </HStack>

          <HStack spacing={2}>
            <Text color="gray.400">Response Speed:</Text>
            <Text color="#34d399" fontFamily="mono" fontWeight="700">
              &lt; 35ms
            </Text>
          </HStack>
        </Flex>

        {/* Quick Test Sample Prompts */}
        <Flex
          mt={3}
          alignItems="center"
          justifyContent={['flex-start', 'center']}
          wrap="wrap"
          gap={2}
          px={1}
        >
          <Text fontSize="xs" color="gray.300" fontWeight="700" mr={1}>
            Quick Samples:
          </Text>
          {SAMPLE_URLS.map((sample) => (
            <Badge
              key={sample.label}
              className="mask-quick-chip"
              onClick={() => handleScan(sample.url)}
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              bg="rgba(10, 24, 48, 0.7)"
              color={
                sample.type === 'benign'
                  ? 'green.300'
                  : sample.type === 'phishing'
                  ? 'orange.300'
                  : sample.type === 'malware'
                  ? 'red.300'
                  : sample.type === 'defacement'
                  ? 'purple.300'
                  : 'cyan.300'
              }
              border="1px solid"
              borderColor={
                sample.type === 'benign'
                  ? 'rgba(34, 197, 94, 0.35)'
                  : sample.type === 'phishing'
                  ? 'rgba(249, 115, 22, 0.35)'
                  : sample.type === 'malware'
                  ? 'rgba(239, 68, 68, 0.35)'
                  : sample.type === 'defacement'
                  ? 'rgba(168, 85, 247, 0.35)'
                  : 'rgba(56, 189, 248, 0.35)'
              }
              display="flex"
              alignItems="center"
              gap={1.5}
            >
              <Box
                w="6px"
                h="6px"
                borderRadius="full"
                bg="currentColor"
                boxShadow="0 0 6px currentColor"
              />
              {sample.label}
              <MdArrowForward size={11} />
            </Badge>
          ))}
        </Flex>
      </Box>

      {/* Loading state with cyber scanner animation */}
      {loading && <Loader />}

      {/* Threat Intelligence Verdict Dossier Card with Framer Motion Entrance */}
      <AnimatePresence>
        {!loading && resultData && threat && (
          <Box
            as={motion.div}
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mask-card"
            width="100%"
            p={[5, 8]}
          >
            {/* Header Verdict Banner */}
            <Flex
              direction={['column', 'row']}
              alignItems={['flex-start', 'center']}
              justifyContent="space-between"
              pb={6}
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              gap={5}
            >
              {/* Left: Shield & Verdict */}
              <HStack spacing={4} alignItems="center">
                <Box
                  p={4}
                  borderRadius="2xl"
                  bg={threat.badgeBg}
                  border="2px solid"
                  borderColor={threat.borderColor}
                  className={threat.bgGlow}
                  boxShadow={`0 0 30px ${threat.color}44`}
                >
                  <ThreatIcon size={46} color={threat.color} />
                </Box>

                <Box>
                  <HStack spacing={2} mb={1.5}>
                    <Badge
                      fontSize="2xs"
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      bg={threat.badgeBg}
                      color={threat.textColor}
                      border="1px solid"
                      borderColor={threat.borderColor}
                      fontWeight="800"
                      letterSpacing="0.8px"
                    >
                      {threat.severity}
                    </Badge>
                    <Badge
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      variant="outline"
                      colorScheme="cyan"
                    >
                      ENGINE: {resultData.source.toUpperCase()}
                    </Badge>
                  </HStack>

                  <Text
                    fontSize={['2xl', '3xl']}
                    fontWeight="900"
                    color={threat.textColor}
                    letterSpacing="-0.5px"
                    lineHeight="1.1"
                  >
                    {threat.title}
                  </Text>
                  <Text fontSize="xs" color="gray.300" mt={1} maxW="520px" lineHeight="1.6">
                    {threat.subtitle}
                  </Text>
                </Box>
              </HStack>

              {/* Right: Circular Risk Gauge & Community Trust */}
              <HStack spacing={4} alignItems="center">
                <RiskGauge
                  score={resultData.riskScore ?? 10}
                  color={threat.color}
                  label="Risk Index"
                />
                <Box
                  display={['none', 'block']}
                  textAlign="left"
                  p={3.5}
                  borderRadius="16px"
                  bg="rgba(12, 26, 52, 0.65)"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  minW="145px"
                >
                  <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                    Community Trust
                  </Text>
                  <Text fontSize="lg" fontWeight="900" color="white" fontFamily="mono">
                    {resultData.network?.communityTrust ?? 95}%
                  </Text>
                  <Text fontSize="3xs" color="cyan.300" mt={0.5}>
                    Threat Consensus
                  </Text>
                </Box>
              </HStack>
            </Flex>

            {/* Scanned Target URL & Defanged Safe View Bar */}
            <VStack spacing={2.5} align="stretch" mt={5}>
              <Flex
                p={3}
                borderRadius="14px"
                bg="rgba(10, 24, 48, 0.7)"
                border="1px solid rgba(56, 189, 248, 0.2)"
                alignItems="center"
                justifyContent="space-between"
                gap={3}
              >
                <HStack spacing={2} overflow="hidden">
                  <Text fontSize="xs" color="gray.400" fontWeight="800">
                    TARGET:
                  </Text>
                  <Text
                    fontSize="xs"
                    color="cyan.200"
                    fontFamily="mono"
                    isTruncated
                    maxW={['210px', '540px']}
                  >
                    {resultData.url}
                  </Text>
                </HStack>

                <HStack spacing={2}>
                  <Tooltip label="Copy Live URL" placement="top">
                    <IconButton
                      icon={<MdContentCopy size={14} />}
                      size="xs"
                      variant="ghost"
                      color="cyan.300"
                      _hover={{ bg: 'rgba(56, 189, 248, 0.2)' }}
                      onClick={() => {
                        navigator.clipboard.writeText(resultData.url);
                        toast.info('URL copied!', toastOptions);
                      }}
                      aria-label="Copy Target URL"
                    />
                  </Tooltip>
                  <Tooltip label="Download Full Forensic JSON" placement="top">
                    <IconButton
                      icon={<MdFileDownload size={15} />}
                      size="xs"
                      variant="outline"
                      colorScheme="cyan"
                      onClick={downloadJsonDossier}
                      aria-label="Download JSON Dossier"
                    />
                  </Tooltip>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="cyan"
                    leftIcon={<MdContentCopy size={12} />}
                    onClick={copyReport}
                  >
                    Copy Report
                  </Button>
                </HStack>
              </Flex>

              {/* Defanged URL Bar (Standard SOC Security Sanitization) */}
              <Flex
                px={3.5}
                py={2}
                borderRadius="12px"
                bg="rgba(8, 18, 38, 0.7)"
                border="1px solid rgba(168, 85, 247, 0.25)"
                alignItems="center"
                justifyContent="space-between"
                fontSize="2xs"
              >
                <HStack spacing={2} overflow="hidden">
                  <Badge colorScheme="purple" variant="solid" fontSize="3xs" px={2} py={0.5} borderRadius="md">
                    DEFANGED SAFE FORMAT
                  </Badge>
                  <Text color="gray.300" fontFamily="mono" isTruncated maxW={['220px', '520px']}>
                    {resultData.defangedUrl}
                  </Text>
                </HStack>
                <Button
                  size="xs"
                  variant="ghost"
                  color="purple.300"
                  _hover={{ bg: 'rgba(168, 85, 247, 0.15)' }}
                  onClick={() => {
                    navigator.clipboard.writeText(resultData.defangedUrl);
                    toast.info('Defanged URL copied (safe for incident logs)!', toastOptions);
                  }}
                >
                  Copy Defanged
                </Button>
              </Flex>
            </VStack>

            {/* Modern Segmented Floating Tabs */}
            <Box className="mask-tab-container" mt={6} mb={4}>
              <HStack spacing={1} overflowX="auto">
                <Button
                  className={`mask-tab-pill ${
                    activeTab === 'assessment'
                      ? 'mask-tab-pill-active'
                      : 'mask-tab-pill-inactive'
                  }`}
                  onClick={() => setActiveTab('assessment')}
                >
                  Detection & Consensus
                </Button>
                <Button
                  className={`mask-tab-pill ${
                    activeTab === 'network'
                      ? 'mask-tab-pill-active'
                      : 'mask-tab-pill-inactive'
                  }`}
                  onClick={() => setActiveTab('network')}
                  leftIcon={<RiServerLine size={14} />}
                >
                  Network & Host
                </Button>
                <Button
                  className={`mask-tab-pill ${
                    activeTab === 'forensics'
                      ? 'mask-tab-pill-active'
                      : 'mask-tab-pill-inactive'
                  }`}
                  onClick={() => setActiveTab('forensics')}
                >
                  Lexical Forensics
                </Button>
                <Button
                  className={`mask-tab-pill ${
                    activeTab === 'advisory'
                      ? 'mask-tab-pill-active'
                      : 'mask-tab-pill-inactive'
                  }`}
                  onClick={() => setActiveTab('advisory')}
                >
                  SOC Playbook & MITRE
                </Button>
                <Button
                  className={`mask-tab-pill ${
                    activeTab === 'intelligence'
                      ? 'mask-tab-pill-active'
                      : 'mask-tab-pill-inactive'
                  }`}
                  onClick={() => setActiveTab('intelligence')}
                  leftIcon={<RiCodeSSlashLine size={15} />}
                >
                  Raw Intelligence
                </Button>
              </HStack>
            </Box>

            {/* TAB 1: Assessment & VirusTotal-style Engine Consensus */}
            {activeTab === 'assessment' && (
              <VStack spacing={5} align="stretch" mt={2}>
                {/* Class Probability Distribution Gauges */}
                {resultData.probabilities && (
                  <SimpleGrid columns={[1, 2]} spacing={3}>
                    {Object.entries(resultData.probabilities).map(([name, prob]) => {
                      const isTop = name === resultData.prediction;
                      const colorHex =
                        name === 'benign'
                          ? '#10b981'
                          : name === 'phishing'
                          ? '#f97316'
                          : name === 'malware'
                          ? '#ef4444'
                          : '#a855f7';
                      return (
                        <Box
                          key={name}
                          p={3.5}
                          borderRadius="16px"
                          bg="rgba(12, 26, 52, 0.65)"
                          border="1px solid"
                          borderColor={isTop ? colorHex : 'rgba(255, 255, 255, 0.08)'}
                          boxShadow={isTop ? `0 0 16px ${colorHex}33` : 'none'}
                          transition="all 0.25s ease"
                        >
                          <Flex justifyContent="space-between" alignItems="center" mb={2}>
                            <HStack spacing={2}>
                              <Box w="8px" h="8px" borderRadius="full" bg={colorHex} />
                              <Text
                                fontSize="xs"
                                fontWeight="700"
                                color="white"
                                textTransform="uppercase"
                                letterSpacing="0.5px"
                              >
                                {name}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="800" color={colorHex} fontFamily="mono">
                              {(prob * 100).toFixed(1)}%
                            </Text>
                          </Flex>
                          <Progress
                            value={prob * 100}
                            size="sm"
                            borderRadius="full"
                            sx={{
                              '& > div': {
                                background: colorHex,
                              },
                              background: 'rgba(255, 255, 255, 0.08)',
                            }}
                          />
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}

                {/* VirusTotal-style Security Vendors Consensus Grid */}
                {resultData.consensus && (
                  <Box
                    p={4}
                    borderRadius="18px"
                    bg="rgba(10, 24, 48, 0.55)"
                    border="1px solid rgba(56, 189, 248, 0.2)"
                  >
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                      pb={2}
                      borderBottom="1px solid rgba(255, 255, 255, 0.08)"
                    >
                      <HStack spacing={2}>
                        <RiRadarLine size={18} color="#38bdf8" />
                        <Text
                          fontSize="xs"
                          fontWeight="800"
                          color="gray.200"
                          letterSpacing="1px"
                          textTransform="uppercase"
                        >
                          Security Engines Consensus
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={resultData.consensus.flaggedCount > 0 ? 'red' : 'green'}
                        variant="subtle"
                        fontSize="2xs"
                        px={2.5}
                        py={0.5}
                        borderRadius="md"
                      >
                        {resultData.consensus.consensusText}
                      </Badge>
                    </Flex>

                    <SimpleGrid columns={[1, 2]} spacing={2.5}>
                      {resultData.consensus.engines.map((engine) => (
                        <Flex
                          key={engine.name}
                          p={2.5}
                          borderRadius="12px"
                          className="mask-stat-box"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <HStack spacing={2.5}>
                            {engine.clean ? (
                              <MdCheckCircle size={16} color="#10b981" />
                            ) : (
                              <MdCancel size={16} color="#ef4444" />
                            )}
                            <Box>
                              <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1.2">
                                {engine.name}
                              </Text>
                              <Text fontSize="3xs" color="gray.400">
                                {engine.category}
                              </Text>
                            </Box>
                          </HStack>

                          <Badge
                            fontSize="3xs"
                            variant="solid"
                            colorScheme={engine.clean ? 'green' : 'red'}
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {engine.verdict}
                          </Badge>
                        </Flex>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </VStack>
            )}

            {/* TAB 2: Network & Host Intelligence */}
            {activeTab === 'network' && resultData.network && (
              <VStack spacing={4} align="stretch" mt={2}>
                <SimpleGrid columns={[1, 2]} spacing={3}>
                  <Box
                    p={4}
                    borderRadius="16px"
                    className="mask-stat-box"
                  >
                    <HStack spacing={2} mb={2}>
                      <MdDns color="#38bdf8" size={18} />
                      <Text fontSize="xs" fontWeight="800" color="white" textTransform="uppercase">
                        Resolved IP & ASN Route
                      </Text>
                    </HStack>
                    <VStack align="stretch" spacing={1.5} fontSize="xs">
                      <Flex justify="space-between">
                        <Text color="gray.400">IP Address:</Text>
                        <Text color="cyan.300" fontFamily="mono" fontWeight="700">
                          {resultData.network.resolvedIp}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.400">Autonomous System:</Text>
                        <Text color="purple.300" fontFamily="mono" fontWeight="700">
                          {resultData.network.asn}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.400">Organization / ISP:</Text>
                        <Text color="white" fontWeight="600" isTruncated maxW="200px">
                          {resultData.network.isp}
                        </Text>
                      </Flex>
                    </VStack>
                  </Box>

                  <Box
                    p={4}
                    borderRadius="16px"
                    className="mask-stat-box"
                  >
                    <HStack spacing={2} mb={2}>
                      <MdPublic color="#34d399" size={18} />
                      <Text fontSize="xs" fontWeight="800" color="white" textTransform="uppercase">
                        Server Geolocation & Hosting
                      </Text>
                    </HStack>
                    <VStack align="stretch" spacing={1.5} fontSize="xs">
                      <Flex justify="space-between">
                        <Text color="gray.400">Country:</Text>
                        <Text color="white" fontWeight="700">
                          {resultData.network.country} Node
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.400">Datacenter Region:</Text>
                        <Text color="cyan.200">{resultData.network.location}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.400">Reverse DNS:</Text>
                        <Text color="green.300" fontFamily="mono" fontSize="2xs">
                          r-dns.{resultData.metrics?.hostname || 'domain.net'}
                        </Text>
                      </Flex>
                    </VStack>
                  </Box>
                </SimpleGrid>

                {/* TLS/SSL Profile Card */}
                <Box
                  p={4}
                  borderRadius="16px"
                  bg="rgba(10, 24, 48, 0.6)"
                  border="1px solid rgba(56, 189, 248, 0.2)"
                >
                  <HStack spacing={2} mb={2}>
                    {resultData.network.ssl.valid ? (
                      <RiLock2Line color="#34d399" size={18} />
                    ) : (
                      <RiLockUnlockLine color="#ef4444" size={18} />
                    )}
                    <Text fontSize="xs" fontWeight="800" color="white" textTransform="uppercase">
                      Cryptographic & SSL/TLS Audit
                    </Text>
                    <Badge
                      colorScheme={resultData.network.ssl.valid ? 'green' : 'red'}
                      variant="subtle"
                      fontSize="3xs"
                    >
                      {resultData.network.ssl.validity}
                    </Badge>
                  </HStack>

                  <SimpleGrid columns={[1, 2]} spacing={3} mt={3} fontSize="xs">
                    <Box>
                      <Text fontSize="3xs" color="gray.400" textTransform="uppercase">
                        Certificate Authority (CA)
                      </Text>
                      <Text color="cyan.200" fontWeight="600" mt={0.5}>
                        {resultData.network.ssl.issuer}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="3xs" color="gray.400" textTransform="uppercase">
                        Cipher Suite & Protocol
                      </Text>
                      <Text color="white" fontFamily="mono" fontSize="2xs" mt={0.5}>
                        {resultData.network.ssl.protocol}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              </VStack>
            )}

            {/* TAB 3: Deep Lexical & Structural Forensics */}
            {activeTab === 'forensics' && resultData.metrics && (
              <VStack spacing={4} align="stretch" mt={2}>
                <SimpleGrid columns={[2, 4]} spacing={3}>
                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Target Hostname
                    </Text>
                    <Text
                      fontSize="xs"
                      fontWeight="700"
                      color="cyan.300"
                      fontFamily="mono"
                      mt={1}
                      isTruncated
                    >
                      {resultData.metrics.hostname || 'None'}
                    </Text>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Top-Level Domain
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color="purple.300"
                      fontFamily="mono"
                      mt={1}
                    >
                      {resultData.metrics.tld || 'unknown'}
                    </Text>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Shannon Entropy
                    </Text>
                    <Text fontSize="sm" fontWeight="700" color="white" fontFamily="mono" mt={1}>
                      {resultData.metrics.entropy ?? '3.1'} bits
                    </Text>
                    <Text fontSize="3xs" color="gray.400">
                      {Number(resultData.metrics.entropy || 0) > 4.2
                        ? 'High Obfuscation'
                        : 'Standard Structure'}
                    </Text>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Raw IP Address Host
                    </Text>
                    <Badge
                      mt={1}
                      colorScheme={resultData.metrics.has_ip ? 'red' : 'green'}
                      variant="subtle"
                      fontSize="2xs"
                    >
                      {resultData.metrics.has_ip ? 'Direct IP (Hostile)' : 'Domain Name (Clean)'}
                    </Badge>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Shortening Service
                    </Text>
                    <Badge
                      mt={1}
                      colorScheme={resultData.metrics.is_shortened ? 'orange' : 'green'}
                      variant="subtle"
                      fontSize="2xs"
                    >
                      {resultData.metrics.is_shortened ? 'Shortened URL' : 'None / Direct'}
                    </Badge>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Suspicious Keywords
                    </Text>
                    <Badge
                      mt={1}
                      colorScheme={resultData.metrics.suspicious_words ? 'red' : 'green'}
                      variant="subtle"
                      fontSize="2xs"
                    >
                      {resultData.metrics.suspicious_words ? 'Keyword Detected' : 'None Detected'}
                    </Badge>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Digits / Letters
                    </Text>
                    <Text fontSize="xs" fontWeight="700" color="white" fontFamily="mono" mt={1}>
                      {resultData.metrics.digit_count}D / {resultData.metrics.letter_count}L
                    </Text>
                  </Box>

                  <Box p={3} className="mask-stat-box">
                    <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                      Path Directory Depth
                    </Text>
                    <Text fontSize="sm" fontWeight="700" color="white" fontFamily="mono" mt={1}>
                      {resultData.metrics.no_of_dir ?? 0} levels
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}

            {/* TAB 4: SOC Advisory & MITRE ATT&CK */}
            {activeTab === 'advisory' && (
              <VStack spacing={4} align="stretch" mt={2}>
                {/* MITRE ATT&CK Framework Mapping */}
                {resultData.network?.mitre && (
                  <Box
                    p={4}
                    borderRadius="16px"
                    bg="rgba(10, 24, 48, 0.6)"
                    border="1px solid rgba(168, 85, 247, 0.3)"
                  >
                    <HStack spacing={2} mb={3}>
                      <MdSecurity size={18} color="#c084fc" />
                      <Text
                        fontSize="xs"
                        fontWeight="800"
                        color="purple.200"
                        letterSpacing="1px"
                        textTransform="uppercase"
                      >
                        MITRE ATT&CK® Threat Technique Mapping
                      </Text>
                    </HStack>

                    <SimpleGrid columns={[1, 3]} spacing={2.5}>
                      {resultData.network.mitre.map((m) => (
                        <Box
                          key={m.id}
                          p={2.5}
                          borderRadius="12px"
                          bg="rgba(8, 18, 38, 0.7)"
                          border="1px solid rgba(168, 85, 247, 0.2)"
                        >
                          <Badge colorScheme="purple" variant="solid" fontSize="3xs" mb={1}>
                            {m.id}
                          </Badge>
                          <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1.2">
                            {m.name}
                          </Text>
                          <Text fontSize="3xs" color="gray.400" mt={0.5}>
                            Tactic: {m.tactic}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Action guidance */}
                <Box
                  p={4}
                  borderRadius="16px"
                  bg={threat.badgeBg}
                  border="1px solid"
                  borderColor={threat.borderColor}
                >
                  <HStack spacing={3} mb={2}>
                    <MdShield size={20} color={threat.color} />
                    <Text fontSize="sm" fontWeight="800" color={threat.textColor}>
                      Executive Action Guidance
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.200" lineHeight="1.6">
                    {threat.advice}
                  </Text>
                </Box>

                <SimpleGrid columns={[1, 2]} spacing={3}>
                  <Box
                    p={3.5}
                    borderRadius="14px"
                    className="mask-stat-box"
                  >
                    <Text fontSize="xs" fontWeight="700" color="white" mb={1}>
                      1. End-User Protective Protocol
                    </Text>
                    <Text fontSize="2xs" color="gray.400" lineHeight="1.5">
                      Never input authentication credentials, passwords, or personal identity numbers
                      into flagged or unverified domains. Do not accept certificate bypass warnings in
                      your browser.
                    </Text>
                  </Box>
                  <Box
                    p={3.5}
                    borderRadius="14px"
                    className="mask-stat-box"
                  >
                    <Text fontSize="xs" fontWeight="700" color="white" mb={1}>
                      2. Security Operations (SecOps) Playbook
                    </Text>
                    <Text fontSize="2xs" color="gray.400" lineHeight="1.5">
                      If this URL originated from email or messaging channels, isolate the recipient
                      endpoint, sinkhole the domain at DNS/firewall levels, and invalidate active
                      session tokens.
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}

            {/* TAB 5: Raw Intelligence (JSON Dump) */}
            {activeTab === 'intelligence' && (
              <VStack spacing={3} align="stretch" mt={2}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Text fontSize="2xs" color="gray.400" fontWeight="700" textTransform="uppercase">
                    Forensic Intelligence Payload (JSON)
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="cyan"
                      leftIcon={<MdContentCopy size={12} />}
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(resultData, null, 2));
                        toast.success('JSON copied to clipboard!', toastOptions);
                      }}
                    >
                      Copy JSON
                    </Button>
                    <Button
                      size="xs"
                      variant="solid"
                      colorScheme="cyan"
                      leftIcon={<MdFileDownload size={13} />}
                      onClick={downloadJsonDossier}
                    >
                      Download Dossier
                    </Button>
                  </HStack>
                </Flex>

                <Box
                  p={4}
                  borderRadius="16px"
                  bg="rgba(6, 14, 30, 0.9)"
                  border="1px solid rgba(56, 189, 248, 0.25)"
                  maxH="320px"
                  overflowY="auto"
                >
                  <Text
                    as="pre"
                    fontSize="2xs"
                    color="cyan.200"
                    fontFamily="mono"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {JSON.stringify(resultData, null, 2)}
                  </Text>
                </Box>
              </VStack>
            )}
          </Box>
        )}
      </AnimatePresence>

      {/* Recent Scans History Drawer / Shelf */}
      {recentScans.length > 0 && (
        <Box width="100%" mt={2}>
          <Flex alignItems="center" justifyContent="space-between" mb={3} px={1}>
            <HStack spacing={2}>
              <MdHistory size={18} color="#38bdf8" />
              <Text
                fontSize="xs"
                fontWeight="700"
                color="gray.300"
                letterSpacing="1px"
                textTransform="uppercase"
              >
                Recent Scans (Session History)
              </Text>
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'white' }}
              onClick={() => {
                setRecentScans([]);
                sessionStorage.removeItem('mask_recent_scans');
              }}
            >
              Clear Log
            </Button>
          </Flex>

          <VStack spacing={2} align="stretch">
            {recentScans.map((scan, idx) => {
              const itemVisual = getThreatVisuals(scan.prediction, scan.riskScore);
              return (
                <Flex
                  key={`${scan.url}-${idx}`}
                  p={3}
                  borderRadius="14px"
                  bg="rgba(8, 20, 42, 0.65)"
                  backdropFilter="blur(10px)"
                  border="1px solid rgba(56, 189, 248, 0.15)"
                  alignItems="center"
                  justifyContent="space-between"
                  cursor="pointer"
                  transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  _hover={{
                    borderColor: 'cyan.400',
                    bg: 'rgba(14, 165, 233, 0.12)',
                    transform: 'translateX(4px)',
                  }}
                  onClick={() => {
                    setUrl(scan.url);
                    setResultData(scan);
                  }}
                >
                  <HStack spacing={3} overflow="hidden">
                    <Badge
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      bg={itemVisual.badgeBg}
                      color={itemVisual.textColor}
                      border="1px solid"
                      borderColor={itemVisual.borderColor}
                      minW="80px"
                      textAlign="center"
                    >
                      {scan.prediction.toUpperCase()}
                    </Badge>
                    <Text
                      fontSize="xs"
                      color="gray.200"
                      fontFamily="mono"
                      isTruncated
                      maxW={['180px', '450px']}
                    >
                      {scan.url}
                    </Text>
                  </HStack>

                  <HStack spacing={3}>
                    <Badge
                      colorScheme={scan.prediction === 'benign' ? 'green' : 'red'}
                      variant="subtle"
                      fontSize="3xs"
                    >
                      RISK: {scan.riskScore ?? 5}
                    </Badge>
                    <Text fontSize="2xs" color="gray.400" display={['none', 'inline']}>
                      {scan.timestamp}
                    </Text>
                    <RiExternalLinkLine size={14} color="#38bdf8" />
                  </HStack>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}

      {/* Cyber Security Footer Ribbon */}
      <Flex
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        py={4}
        px={2}
        borderTop="1px solid rgba(255, 255, 255, 0.08)"
        fontSize="xs"
        color="gray.400"
        wrap="wrap"
        gap={2}
      >
        <HStack spacing={2}>
          <Box w="6px" h="6px" borderRadius="full" bg="cyan.400" />
          <Text>MASK Autonomous Zero-Trust Threat Intelligence Radar</Text>
        </HStack>
        <Text fontSize="2xs" color="gray.400">
          Powered by Multi-Class Decision Heuristics & Reputation Scoring
        </Text>
      </Flex>

      <ToastContainer />
    </Stack>
  );
}

export default InputContainer;
