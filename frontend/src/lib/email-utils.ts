import DOMPurify from 'dompurify';

export interface DetectedLink {
  url: string;
  type: 'meet' | 'classroom' | 'zoom' | 'teams' | 'pdf' | 'calendar' | 'generic';
  label: string;
  icon: string;
}

const LINK_PATTERNS: { regex: RegExp; type: DetectedLink['type']; label: string; icon: string }[] = [
  { regex: /https?:\/\/meet\.google\.com\/[a-z\-]+/gi, type: 'meet', label: 'Unirse a Meet', icon: 'video' },
  { regex: /https?:\/\/classroom\.google\.com\/[a-z\/0-9]+/gi, type: 'classroom', label: 'Abrir Classroom', icon: 'book' },
  { regex: /https?:\/\/[-a-zA-Z0-9]+\.zoom\.us\/[a-z\/0-9]+/gi, type: 'zoom', label: 'Unirse a Zoom', icon: 'video' },
  { regex: /https?:\/\/teams\.microsoft\.com\/[a-z\/0-9]+/gi, type: 'teams', label: 'Abrir Teams', icon: 'video' },
  { regex: /https?:\/\/calendar\.google\.com\/[a-z\/0-9]+/gi, type: 'calendar', label: 'Ver calendario', icon: 'calendar' },
  { regex: /https?:\/\/drive\.google\.com\/[a-z\/0-9]+/gi, type: 'pdf', label: 'Abrir Drive', icon: 'file' },
  { regex: /https?:\/\/[^\s"'<>]+\.pdf(\?[^\s"'<>]*)?/gi, type: 'pdf', label: 'Abrir PDF', icon: 'file' },
];

const CLASSROOM_WORD_PATTERNS = [
  /\bclassroom\b/gi,
  /\btareas?\b/gi,
  /\btaller(es)?\b/gi,
  /\binforme\b/gi,
  /\bentreg(a|ar|able)\b/gi,
  /\bsubir\b/gi,
  /\badjuntar\b/gi,
  /\bplataforma\b/gi,
  /\b(próximo|proximo)\s+(día|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\b/gi,
  /\b(debe|deben|tiene|tienen)\s+(entregar|presentar|subir|enviar|completar|hacer|realizar)\b/gi,
  /\bno\s+(olvide|olviden)\s+(entregar|enviar|subir|presentar)\b/gi,
  /\brecuerden?\s+(entregar|enviar|subir|presentar|que)\b/gi,
];

const REPETITIVE_PATTERNS = [
  /─{2,}/g,
  /\*{3,}/g,
  /_{3,}/g,
  /=+\s*=\s*=\s*=\s*=\s*=\s*=\s*=\s*=\s*=\s*=\s*=/g,
  /(Click\s+(here|aquí|acá)\s+(to|para|y)\s+(view|see|open|ver|abrir)\s+[a-zA-Z\s]+\.(com|org|edu)\/[^\s]+)/gi,
  /(Haga\s+clic\s+(aquí|acá)\s+para\s+ver\s+el\s+correo\s+en\s+[a-zA-Z\.]+\.[a-zA-Z]+)/gi,
  /(View\s+it\s+in\s+your\s+browser)/gi,
  /(Ver\s+en\s+el\s+navegador)/gi,
  /(This\s+message\s+was\s+sent\s+to)/gi,
  /(Este\s+correo\s+se\s+envió\s+a)/gi,
  /(You\s+are\s+receiving\s+this)/gi,
  /(Recibes\s+este\s+correo)/gi,
  /(If\s+you\s+have\s+any\s+(questions|doubts|issues|problems))/gi,
  /(Si\s+tienes\s+alguna\s+(duda|pregunta|consulta|inconveniente))/gi,
  /©\s*\d{4}\s+Google\s+(LLC|Inc\.)/gi,
  /Google\s+(llc|inc\.)\s*\d{4}\s+©/gi,
];

const USELESS_TAGS = [
  'meta', 'style', 'script', 'link', 'base', 'noscript',
  'iframe', 'object', 'embed', 'applet',
];

const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark', 'del', 'ins',
  'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'blockquote', 'pre', 'code', 'figure', 'figcaption', 'hr',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
  'title', 'cite', 'datetime', 'class',
];

export function cleanHtml(html: string): string {
  if (!html) return '';

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: USELESS_TAGS,
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'background', 'action', 'formaction'],
    WHOLE_DOCUMENT: false,
    RETURN_DOM_FRAGMENT: false,
    ADD_ATTR: ['target'],
  });

  return sanitized;
}

export function cleanPlainText(text: string): string {
  if (!text) return '';

  let clean = text;

  for (const pattern of REPETITIVE_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  clean = clean.replace(/\n{4,}/g, '\n\n\n');
  clean = clean.replace(/[ \t]{3,}/g, ' ');
  clean = clean.replace(/^[ \t]+|[ \t]+$/gm, '');

  const lines = clean.split('\n');
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      unique.push(line);
    } else if (!trimmed) {
      unique.push(line);
    }
  }

  return unique.join('\n').trim();
}

export function detectImportantLinks(text: string): DetectedLink[] {
  if (!text) return [];
  const found: DetectedLink[] = [];
  const seen = new Set<string>();

  for (const pattern of LINK_PATTERNS) {
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      const url = match[0].replace(/[.,;:!?)"'\]>]+$/, '');
      if (!seen.has(url)) {
        seen.add(url);
        found.push({ url, type: pattern.type, label: pattern.label, icon: pattern.icon });
      }
    }
  }

  return found;
}

export function extractAllLinks(text: string): string[] {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s"'<>(){}[\]|]+/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];

  const seen = new Set<string>();
  return matches
    .map((u) => u.replace(/[.,;:!?)"'\]>]+$/, ''))
    .filter((u) => {
      const normalized = u.replace(/https?:\/\//, '').replace(/^www\./, '');
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export function detectGoogleClassroomContent(text: string): boolean {
  if (!text) return false;
  let score = 0;

  if (/classroom\.google\.com/i.test(text)) score += 30;
  if (/google\.com/i.test(text)) score += 10;

  for (const pattern of CLASSROOM_WORD_PATTERNS) {
    if (pattern.test(text)) score += 10;
  }

  return score >= 20;
}

export function removeDuplicateLines(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const seen = new Map<string, number>();
  const result: string[] = [];

  for (const line of lines) {
    const key = line.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) {
      result.push(line);
      continue;
    }
    if (seen.has(key)) {
      seen.set(key, seen.get(key)! + 1);
      if (seen.get(key)! > 2) continue;
    } else {
      seen.set(key, 1);
    }
    result.push(line);
  }

  return result.join('\n');
}

export function stripGoogleWrapper(html: string): string {
  if (!html) return html;

  let cleaned = html;

  cleaned = cleaned.replace(/<div[^>]*style="[^"]*display:none[^"]*"[^>]*>.*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<img[^>]*src="https?:\/\/[^"]*google[^"]*"[^>]*\/?>/gi, '');
  cleaned = cleaned.replace(/<a[^>]*href="https?:\/\/accounts\.google\.com[^"]*"[^>]*>.*?<\/a>/gi, '');
  cleaned = cleaned.replace(/<a[^>]*href="https?:\/\/www\.google\.com\/url\?[^"]*"[^>]*>.*?<\/a>/gi, '');

  return cleaned;
}

export function prepareEmailContent(bodyHtml?: string | null, bodyPlain?: string | null): {
  html: string;
  plain: string;
  importantLinks: DetectedLink[];
  allLinks: string[];
  hasClassroomContent: boolean;
} {
  const importantLinks: DetectedLink[] = [];
  const allLinks: string[] = [];

  if (bodyHtml) {
    let cleaned = stripGoogleWrapper(bodyHtml);
    cleaned = removeDuplicateLines(cleaned);

    const linksFromHtml = detectImportantLinks(cleaned);
    importantLinks.push(...linksFromHtml);
    allLinks.push(...extractAllLinks(cleaned));

    cleaned = cleanHtml(cleaned);
    cleaned = removeDuplicateLines(cleaned);

    return {
      html: cleaned,
      plain: cleanPlainText(bodyPlain || ''),
      importantLinks,
      allLinks: [...new Set(allLinks)],
      hasClassroomContent: detectGoogleClassroomContent(cleaned),
    };
  }

  if (bodyPlain) {
    let cleaned = cleanPlainText(bodyPlain);
    cleaned = removeDuplicateLines(cleaned);

    const linksFromPlain = detectImportantLinks(cleaned);
    importantLinks.push(...linksFromPlain);
    allLinks.push(...extractAllLinks(cleaned));

    return {
      html: '',
      plain: cleaned,
      importantLinks,
      allLinks: [...new Set(allLinks)],
      hasClassroomContent: detectGoogleClassroomContent(cleaned),
    };
  }

  return {
    html: '',
    plain: '',
    importantLinks: [],
    allLinks: [],
    hasClassroomContent: false,
  };
}
