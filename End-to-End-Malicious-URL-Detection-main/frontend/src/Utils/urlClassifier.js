import modelTree from './model_tree.json';

const SHORTENING_REGEX = /bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|is\.gd|cli\.gs|yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|twurl\.nl|snipurl\.com|short\.to|BudURL\.com|ping\.fm|post\.ly|Just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|doiop\.com|short\.ie|kl\.am|wp\.me|rubyurl\.com|om\.ly|to\.ly|bit\.do|lnkd\.in|db\.tt|qr\.ae|adf\.ly|bitly\.com|cur\.lv|ity\.im|q\.gs|po\.st|bc\.vc|twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org|prettylinkpro\.com|scrnch\.me|filoops\.info|vzturl\.com|qr\.net|1url\.com|tweez\.me|v\.gd|link\.zip\.net/i;

const IP_REGEX = /(([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\/)|((0x[0-9a-fA-F]{1,2})\.(0x[0-9a-fA-F]{1,2})\.(0x[0-9a-fA-F]{1,2})\.(0x[0-9a-fA-F]{1,2})\/)|(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}/;

const SUSPICIOUS_WORDS_REGEX = /PayPal|login|signin|bank|account|update|free|lucky|service|bonus|ebayisapi|webscr/i;

const TRUSTED_DOMAINS = [
  'google.com', 'wikipedia.org', 'github.com', 'youtube.com',
  'amazon.com', 'microsoft.com', 'apple.com', 'facebook.com',
  'twitter.com', 'x.com', 'linkedin.com', 'netflix.com',
  'stackoverflow.com', 'reddit.com', 'yahoo.com', 'cloudflare.com',
  'instagram.com', 'spotify.com', 'gitlab.com', 'medium.com'
];

function isTrustedDomain(hostname, url) {
  if (!hostname) return false;
  const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
  const isTrusted = TRUSTED_DOMAINS.some(
    (d) => cleanHost === d || cleanHost.endsWith('.' + d)
  );
  const hasSuspiciousWords = SUSPICIOUS_WORDS_REGEX.test(url);
  return isTrusted && !hasSuspiciousWords;
}

function parseUrlParts(rawUrl) {
  let url = rawUrl;
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  try {
    const parsed = new URL(url);
    return {
      hostname: parsed.hostname || '',
      pathname: parsed.pathname || '',
    };
  } catch (e) {
    const withoutProto = rawUrl.replace(/^https?:\/\//i, '');
    const parts = withoutProto.split('/');
    return {
      hostname: parts[0] || '',
      pathname: parts.length > 1 ? '/' + parts.slice(1).join('/') : '',
    };
  }
}

export function extractFeatures(url) {
  const { hostname, pathname } = parseUrlParts(url);

  const having_ip_address = IP_REGEX.test(url) ? 1 : 0;
  const abnormal_url = (hostname && url.includes(hostname)) ? 1 : 0;
  const count_dot = (url.match(/\./g) || []).length;
  const count_www = (url.match(/www/gi) || []).length;
  const count_atrate = (url.match(/@/g) || []).length;
  const no_of_dir = (pathname.match(/\//g) || []).length;
  const no_of_embed = (pathname.match(/\/\//g) || []).length;
  const shortening_service = SHORTENING_REGEX.test(url) ? 1 : 0;
  const count_https = (url.match(/https/gi) || []).length;
  const count_http = (url.match(/http/gi) || []).length;
  const count_per = (url.match(/%/g) || []).length;
  const count_ques = (url.match(/\?/g) || []).length;
  const count_hyphen = (url.match(/-/g) || []).length;
  const count_equal = (url.match(/=/g) || []).length;
  const url_length = url.length;
  const hostname_length = hostname.length;
  const suspicious_words = SUSPICIOUS_WORDS_REGEX.test(url) ? 1 : 0;

  const pathParts = pathname.split('/');
  const fd_length = pathParts.length > 1 ? pathParts[1].length : 0;

  let digit_count = 0;
  let letter_count = 0;
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      digit_count++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      letter_count++;
    }
  }

  const features = [
    having_ip_address,
    abnormal_url,
    count_dot,
    count_www,
    count_atrate,
    no_of_dir,
    no_of_embed,
    shortening_service,
    count_https,
    count_http,
    count_per,
    count_ques,
    count_hyphen,
    count_equal,
    url_length,
    hostname_length,
    suspicious_words,
    fd_length,
    digit_count,
    letter_count,
  ];

  return {
    featureVector: features,
    metrics: {
      url_length,
      hostname,
      digit_count,
      letter_count,
      has_ip: having_ip_address === 1,
      is_shortened: shortening_service === 1,
      suspicious_words: suspicious_words === 1,
    },
  };
}

export function classifyUrlLocally(url) {
  const { featureVector, metrics } = extractFeatures(url);

  // Check trusted domain reputation
  if (isTrustedDomain(metrics.hostname, url)) {
    return {
      prediction: 'benign',
      confidence: 0.99,
      probabilities: {
        benign: 0.99,
        phishing: 0.005,
        malware: 0.003,
        defacement: 0.002,
      },
      metrics,
      source: 'reputation-verified',
    };
  }

  let node = 0;
  const { children_left, children_right, feature, threshold, value, classes } = modelTree;

  while (children_left[node] !== -1 && children_right[node] !== -1) {
    const fIdx = feature[node];
    const th = threshold[node];
    if (featureVector[fIdx] <= th) {
      node = children_left[node];
    } else {
      node = children_right[node];
    }
  }

  const leafValues = value[node];
  const total = leafValues.reduce((sum, v) => sum + v, 0) || 1;

  let maxIdx = 0;
  let maxVal = leafValues[0];
  const probabilities = {};

  for (let i = 0; i < leafValues.length; i++) {
    const prob = leafValues[i] / total;
    const className = classes[i] || `class_${i}`;
    probabilities[className] = Number(prob.toFixed(4));
    if (leafValues[i] > maxVal) {
      maxVal = leafValues[i];
      maxIdx = i;
    }
  }

  const prediction = classes[maxIdx] || 'benign';
  const confidence = Number((maxVal / total).toFixed(4));

  return {
    prediction,
    confidence,
    probabilities,
    metrics,
    source: 'client-model',
  };
}
