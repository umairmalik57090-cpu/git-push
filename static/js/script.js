const LOCAL_STORAGE_THEME = 'uniassist-theme';
const LOCAL_STORAGE_ANALYTICS = 'uniassist-analytics';
const SECRET_ADMIN_CLICKS = 5;

const suggestedTopics = [
  { label: 'Admissions', query: 'How can I get admission?' },
  { label: 'Courses', query: 'What courses are available?' },
  { label: 'Scholarships', query: 'How do I apply for scholarships?' },
  { label: 'Hostel', query: 'What are the hostel fees?' },
  { label: 'Fee Structure', query: 'What is the college fee?' },
  { label: 'Library', query: 'Where is the library?' },
  { label: 'Faculty', query: 'Who is the principal?' },
  { label: 'Departments', query: 'What branches does the college offer?' },
  { label: 'Student Portal', query: 'How can I access the student portal?' },
  { label: 'Examinations', query: 'When are the semester exams?' },
  { label: 'Results', query: 'How can I check exam results?' }
];

const faqs = [
  'How can I get admission?',
  'What is the admission process?',
  'How do I apply for scholarships?',
  'What are the hostel fees?',
  'Where is the library?',
  'What courses are available?',
  'How can I contact the college?',
  'When are the semester exams?'
];

const greetingPatterns = [
  'hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'welcome'
];
const goodbyePatterns = [
  'bye', 'goodbye', 'see you', 'thanks', 'thank you', 'ttyl', 'talk to you later'
];
const greetingResponses = [
  'Hello! I am UniAssist AI, how can I help you today?',
  'Hi there! Ask me anything about college facilities, admissions, or campus life.',
  'Welcome! I am ready to help with your student support questions.'
];
const goodbyeResponses = [
  'Goodbye! Feel free to come back if you have more questions.',
  'Thanks for chatting with UniAssist AI. Have a great day!',
  'See you soon! I am here when you need help again.'
];

const fallbackResponses = [
  'I am sorry, I could not find an exact answer. Can you try asking in another way?',
  'That question is not in my knowledge base yet. Please ask another college-related question.'
];

let elements = null;

function initElements() {
  elements = {
    splash: document.getElementById('splashScreen'),
    splashStatus: document.getElementById('splashStatus'),
    appShell: document.getElementById('appShell'),
    chatPanel: document.getElementById('chatPanel'),
    responseSummary: document.getElementById('responseSummary'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    historyList: document.getElementById('historyList'),
    topicGrid: document.getElementById('topicGrid'),
    faqGrid: document.getElementById('faqGrid'),
    faqSection: document.getElementById('faqSection'),
    statQuestions: document.getElementById('statQuestions'),
    statAnswers: document.getElementById('statAnswers'),
    statSuccess: document.getElementById('statSuccess'),
    statFallback: document.getElementById('statFallback'),
    statDuration: document.getElementById('statDuration'),
    newChatBtn: document.getElementById('newChatBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    toggleThemeBtn: document.getElementById('toggleThemeBtn'),
    exportTxtBtn: document.getElementById('exportTxtBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    faqToggleBtn: document.getElementById('faqToggleBtn'),
    adminPanel: document.getElementById('adminPanel'),
    closeAdminBtn: document.getElementById('closeAdminBtn'),
    adminTotalQuestions: document.getElementById('adminTotalQuestions'),
    adminTopTopic: document.getElementById('adminTopTopic'),
    adminLeastTopic: document.getElementById('adminLeastTopic'),
    adminAverageScore: document.getElementById('adminAverageScore'),
    adminFallbackCount: document.getElementById('adminFallbackCount'),
    categoryPie: document.getElementById('categoryPie'),
    dailyGraph: document.getElementById('dailyGraph'),
    resetAnalyticsBtn: document.getElementById('resetAnalyticsBtn')
  };

  const missing = Object.entries(elements).filter(([, element]) => !element).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing DOM elements: ${missing.join(', ')}`);
  }
}

class ChatbotEngine {
  constructor(intents) {
    this.intents = intents || [];
    this.fallback = fallbackResponses;
    this.sessionStart = Date.now();
    this.analytics = this.loadAnalytics();
  }

  loadAnalytics() {
    const stored = localStorage.getItem(LOCAL_STORAGE_ANALYTICS);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      totalQuestions: 0,
      totalMatches: 0,
      totalFallbacks: 0,
      totalScore: 0,
      categoryCounts: {},
      dailyUsage: {}
    };
  }

  saveAnalytics() {
    localStorage.setItem(LOCAL_STORAGE_ANALYTICS, JSON.stringify(this.analytics));
  }

  recordAnalytics({ score, category, fallback }) {
    this.analytics.totalQuestions += 1;
    if (!fallback) {
      this.analytics.totalMatches += 1;
      this.analytics.totalScore += score;
    } else {
      this.analytics.totalFallbacks += 1;
    }
    if (category) {
      this.analytics.categoryCounts[category] = (this.analytics.categoryCounts[category] || 0) + 1;
    }
    const today = new Date().toISOString().split('T')[0];
    this.analytics.dailyUsage[today] = (this.analytics.dailyUsage[today] || 0) + 1;
    this.saveAnalytics();
  }

  sanitize(text) {
    return text
      .toLowerCase()
      .replace(/[\p{P}$+<=>^`|~]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  tokenize(text) {
    return this.sanitize(text).split(' ').filter(Boolean);
  }

  similarity(a, b) {
    const normalizedA = this.sanitize(a);
    const normalizedB = this.sanitize(b);
    if (!normalizedA || !normalizedB) return 0;
    if (normalizedA === normalizedB) return 1;
    const tokensA = new Set(this.tokenize(normalizedA));
    const tokensB = new Set(this.tokenize(normalizedB));
    const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
    const tokenScore = intersection * 2 / (tokensA.size + tokensB.size);
    const charScore = 1 - this.levenshtein(normalizedA, normalizedB) / Math.max(normalizedA.length, normalizedB.length, 1);
    return Math.max(0, Math.min(1, (tokenScore * 0.62 + charScore * 0.38)));
  }

  levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return matrix[a.length][b.length];
  }

  getCategoryLabel(tag) {
    return tag
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  query(text) {
    const result = {
      rawText: text,
      confidence: 0,
      category: 'Unknown',
      matchedPattern: '',
      intent: 'Fallback',
      response: this.fallback[Math.floor(Math.random() * this.fallback.length)],
      responseType: 'fallback',
      success: false
    };

    const cleaned = this.sanitize(text);
    if (!cleaned) {
      return result;
    }

    const isGreeting = greetingPatterns.some((pattern) => cleaned.includes(pattern));
    const isGoodbye = goodbyePatterns.some((pattern) => cleaned.includes(pattern));
    if (isGreeting && !isGoodbye) {
      result.confidence = 1;
      result.category = 'Greeting';
      result.matchedPattern = cleaned;
      result.intent = 'Greeting';
      result.response = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
      result.success = true;
      result.responseType = 'smart';
      this.recordAnalytics({ score: 100, category: result.category, fallback: false });
      return result;
    }

    if (isGoodbye && !isGreeting) {
      result.confidence = 1;
      result.category = 'Goodbye';
      result.matchedPattern = cleaned;
      result.intent = 'Goodbye';
      result.response = goodbyeResponses[Math.floor(Math.random() * goodbyeResponses.length)];
      result.success = true;
      result.responseType = 'smart';
      this.recordAnalytics({ score: 100, category: result.category, fallback: false });
      return result;
    }

    let best = { score: 0, pattern: '', tag: '', responses: [] };

    this.intents.forEach((item) => {
      item.patterns.forEach((pattern) => {
        const score = this.similarity(text, pattern);
        if (score > best.score) {
          best = {
            score,
            pattern,
            tag: item.tag,
            responses: item.responses || []
          };
        }
      });
    });

    result.confidence = best.score;
    if (best.score >= 0.7) {
      result.category = this.getCategoryLabel(best.tag);
      result.matchedPattern = best.pattern;
      result.intent = this.getCategoryLabel(best.tag);
      result.responseType = 'knowledge-base';
      result.success = true;
      result.response = best.responses[Math.floor(Math.random() * best.responses.length)];
      if (best.score < 0.75) {
        result.response += '\n\n*Note: I found a possible match from the knowledge base.*';
      }
      this.recordAnalytics({ score: best.score * 100, category: result.category, fallback: false });
    } else {
      result.category = 'Unknown';
      result.matchedPattern = best.pattern;
      result.intent = 'Fallback';
      result.responseType = 'fallback';
      result.success = false;
      result.response = this.fallback[Math.floor(Math.random() * this.fallback.length)];
      this.recordAnalytics({ score: best.score * 100, category: result.category, fallback: true });
    }

    return result;
  }

  regenerate(intentTag, excludeResponse) {
    const intent = this.intents.find((item) => item.tag === intentTag);
    if (!intent || !intent.responses || intent.responses.length === 0) {
      return this.fallback[0];
    }
    const alternatives = intent.responses.filter((response) => response !== excludeResponse);
    if (alternatives.length === 0) {
      return intent.responses[0];
    }
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  getStatistics() {
    const avgScore = this.analytics.totalMatches ? Math.round(this.analytics.totalScore / this.analytics.totalMatches) : 0;
    const categoryEntries = Object.entries(this.analytics.categoryCounts);
    const sorted = categoryEntries.sort((a, b) => b[1] - a[1]);
    return {
      totalQuestions: this.analytics.totalQuestions,
      totalMatches: this.analytics.totalMatches,
      totalFallbacks: this.analytics.totalFallbacks,
      averageScore: avgScore,
      mostAsked: sorted[0] ? sorted[0][0] : 'None',
      leastAsked: sorted[sorted.length - 1] ? sorted[sorted.length - 1][0] : 'None'
    };
  }
}

class ChatUI {
  constructor(engine) {
    this.engine = engine;
    this.conversation = [];
    this.adminClickCounter = 0;
    this.sessionTimer = null;
    this.startSessionTimer();
    this.currentTheme = this.loadTheme();
    this.applyTheme();
    this.bindEvents();
    this.renderTopics();
    this.renderFaqs();
    this.renderHistory();
    this.updateSessionStats();
  }

  startSessionTimer() {
    const start = Date.now();
    this.sessionTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - start) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      elements.statDuration.textContent = `${minutes}m ${remainder}s`;
    }, 1000);
  }

  loadTheme() {
    const stored = localStorage.getItem(LOCAL_STORAGE_THEME);
    if (stored) return stored;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  }

  applyTheme() {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = this.currentTheme === 'dark' || (this.currentTheme === 'system' && systemPrefersDark);
    document.body.classList.toggle('dark', shouldUseDark);
    elements.toggleThemeBtn.textContent = this.currentTheme === 'light' ? 'Switch to Dark' : this.currentTheme === 'dark' ? 'System Theme' : 'Light Mode';
    localStorage.setItem(LOCAL_STORAGE_THEME, this.currentTheme);
  }

  bindEvents() {
    elements.sendBtn.addEventListener('click', () => this.handleSend());
    elements.userInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.handleSend();
    });
    elements.newChatBtn.addEventListener('click', () => this.resetConversation());
    elements.clearHistoryBtn.addEventListener('click', () => this.resetConversation());
    elements.toggleThemeBtn.addEventListener('click', () => {
      if (this.currentTheme === 'light') {
        this.currentTheme = 'dark';
      } else if (this.currentTheme === 'dark') {
        this.currentTheme = 'system';
      } else {
        this.currentTheme = 'light';
      }
      this.applyTheme();
    });
    elements.faqToggleBtn.addEventListener('click', () => {
      elements.faqSection.classList.toggle('hidden');
    });
    elements.exportTxtBtn.addEventListener('click', () => this.exportConversation('txt'));
    elements.exportPdfBtn.addEventListener('click', () => this.exportConversation('pdf'));
    elements.resetAnalyticsBtn.addEventListener('click', () => this.resetAnalytics());
    elements.closeAdminBtn.addEventListener('click', () => this.toggleAdmin(false));

    document.body.addEventListener('click', (event) => {
      if (event.target.matches('.topic-card')) {
        const query = event.target.dataset.query;
        this.sendMessage(query);
      }
      if (event.target.matches('.faq-card')) {
        const query = event.target.dataset.query;
        this.sendMessage(query);
      }
      if (event.target.matches('.history-item')) {
        const index = Number(event.target.dataset.index);
        document.querySelectorAll('.message.user')[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (event.target.matches('.copy-btn')) {
        const text = event.target.closest('.message').querySelector('.message-text').innerText;
        navigator.clipboard.writeText(text);
      }
      if (event.target.matches('.regenerate-btn')) {
        const messageElement = event.target.closest('.message');
        const intent = messageElement.dataset.intent;
        const exclude = messageElement.dataset.response;
        if (intent && intent !== 'Fallback') {
          const response = this.engine.regenerate(intent, exclude);
          this.addBotMessage(response, {
            confidence: 0.82,
            category: this.engine.getCategoryLabel(intent),
            matchedPattern: 'Regenerated response',
            intent: this.engine.getCategoryLabel(intent),
            responseType: 'regeneration',
            success: true
          });
        }
      }
    });

    document.body.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'a') {
        this.toggleAdmin(true);
      }
    });

    document.querySelector('footer').addEventListener('click', () => {
      this.adminClickCounter += 1;
      if (this.adminClickCounter >= SECRET_ADMIN_CLICKS) {
        this.adminClickCounter = 0;
        this.toggleAdmin(true);
      }
    });
  }

  async handleSend() {
    const query = elements.userInput.value.trim();
    if (!query) return;
    this.sendMessage(query);
    elements.userInput.value = '';
    elements.userInput.focus();
  }

  sendMessage(message) {
    this.addUserMessage(message);
    this.addSystemMessage('Searching knowledge base...');
    setTimeout(() => this.addSystemMessage('Finding best match...'), 450);
    setTimeout(() => this.addSystemMessage('Generating response...'), 900);

    const queryStart = performance.now();
    const result = this.engine.query(message);
    const queryEnd = performance.now();
    const responseTime = ((queryEnd - queryStart) / 1000).toFixed(2);

    setTimeout(() => {
      this.addBotMessage(result.response, {
        confidence: result.confidence,
        category: result.category,
        matchedPattern: result.matchedPattern,
        intent: result.intent,
        responseTime,
        responseType: result.responseType,
        success: result.success,
        tag: result.intent
      });
      this.updateResponseSummary(result, responseTime);
      this.renderHistory();
      this.updateSessionStats();
      this.removeSystemMessages();
    }, 1400);
  }

  addUserMessage(text) {
    const message = {
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    this.conversation.push(message);
    this.renderMessage(message);
  }

  addBotMessage(text, meta = {}) {
    const message = {
      role: 'bot',
      text,
      meta,
      timestamp: new Date().toISOString()
    };
    this.conversation.push(message);
    this.renderMessage(message);
  }

  addSystemMessage(text) {
    const message = {
      role: 'system',
      text,
      timestamp: new Date().toISOString()
    };
    this.renderMessage(message);
  }

  renderMessage(message) {
    const container = document.createElement('article');
    container.className = `message ${message.role}`;
    if (message.role === 'bot' && message.meta) {
      container.dataset.intent = message.meta.intent;
      container.dataset.response = message.text;
    }

    const textBlock = document.createElement('div');
    textBlock.className = 'message-text';
    if (message.role === 'bot' && message.meta) {
      this.typeTextBlock(textBlock, message.text);
    } else {
      textBlock.innerHTML = message.text.replace(/\n/g, '<br/>');
    }
    container.appendChild(textBlock);

    if (message.role === 'bot' && message.meta) {
      const metaCard = document.createElement('div');
      metaCard.className = 'message-meta';
      metaCard.innerHTML = `
        <span><strong>Category:</strong> ${message.meta.category}</span>
        <span><strong>Confidence:</strong> ${this.formatConfidence(message.meta.confidence)}</span>
        <span><strong>Response Time:</strong> ${message.meta.responseTime || '—'}s</span>
      `;
      container.appendChild(metaCard);

      const actions = document.createElement('div');
      actions.className = 'message-actions';
      actions.innerHTML = `
        <button class="copy-btn">Copy Response</button>
        <button class="like-btn">Like</button>
        <button class="dislike-btn">Dislike</button>
        <button class="regenerate-btn">Regenerate</button>
      `;
      container.appendChild(actions);
    }

    if (message.role === 'system') {
      container.style.opacity = 0.72;
      container.style.fontStyle = 'italic';
      container.style.maxWidth = '60%';
    }

    elements.chatPanel.appendChild(container);
    elements.chatPanel.scrollTop = elements.chatPanel.scrollHeight;
  }

  formatConfidence(value) {
    if (typeof value !== 'number') return '—';
    const percent = Math.round(value * 100);
    if (percent >= 90) return `${percent}% • Excellent Match`;
    if (percent >= 75) return `${percent}% • Good Match`;
    if (percent >= 70) return `${percent}% • Possible Match`;
    return `${percent}% • Low Confidence`;
  }

  removeSystemMessages() {
    document.querySelectorAll('.message.system').forEach((node) => node.remove());
  }

  updateResponseSummary(result, responseTime) {
    elements.responseSummary.innerHTML = `
      <div class="summary-card">
        <strong>Knowledge Base Match</strong>
        <div>Matched Pattern: <em>"${result.matchedPattern || 'N/A'}"</em></div>
        <div>Similarity: <strong>${Math.round(result.confidence * 100)}%</strong></div>
        <div>Intent: <strong>${result.intent}</strong></div>
        <div>Response Time: <strong>${responseTime}s</strong></div>
      </div>
    `;
  }

  renderTopics() {
    elements.topicGrid.innerHTML = suggestedTopics
      .map((topic) => `<div class="topic-card" data-query="${topic.query}"><span>${topic.label}</span></div>`)
      .join('');
  }

  renderFaqs() {
    elements.faqGrid.innerHTML = faqs
      .map((question) => `<div class="faq-card" data-query="${question}">${question}</div>`)
      .join('');
  }

  renderHistory() {
    elements.historyList.innerHTML = this.conversation
      .filter((item) => item.role === 'user')
      .map((item, index) => `<div class="history-item" data-index="${index}">${item.text}</div>`)
      .join('');
  }

  updateSessionStats() {
    elements.statQuestions.textContent = this.engine.analytics.totalQuestions;
    elements.statAnswers.textContent = this.conversation.filter((item) => item.role === 'bot').length;
    elements.statSuccess.textContent = this.engine.analytics.totalMatches;
    elements.statFallback.textContent = this.engine.analytics.totalFallbacks;
  }

  resetConversation() {
    this.conversation = [];
    elements.chatPanel.innerHTML = '';
    this.updateResponseSummary({ matchedPattern: '', confidence: 0, intent: '—' }, '0.00');
    this.renderHistory();
  }

  exportConversation(format) {
    const content = this.conversation
      .map((item) => {
        const role = item.role === 'bot' ? 'Assistant' : 'You';
        return `${role}: ${item.text.replace(/\n/g, ' ')}\n`;
      })
      .join('\n');
    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      this.downloadBlob(blob, 'uniassist-conversation.txt');
      return;
    }
    if (format === 'pdf') {
      this.printConversation(content);
      return;
    }
  }

  printConversation(content) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>UniAssist AI Conversation</title><style>body{font-family:Arial,sans-serif;color:#111;background:#fff;padding:24px;}pre{white-space:pre-wrap;word-break:break-word;font-size:14px;}h1{font-size:22px;margin-bottom:12px;}p{margin:0 0 10px;}</style></head><body><h1>UniAssist AI Conversation Export</h1><p>${new Date().toLocaleString()}</p><pre>${this.escapeHtml(content)}</pre></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  createPdfBlob(content) {
    const lines = content.split('\n');
    const margin = 40;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const lineHeight = 14;
    const maxLineWidth = pageWidth - margin * 2;
    const pdfLines = [];

    let yPosition = pageHeight - margin;
    const header = 'UniAssist AI Conversation Export';
    const creationDate = new Date().toLocaleString();

    pdfLines.push(`BT /F1 14 Tf ${margin} ${pageHeight - margin} Td (${this.escapePdfText(header)}) Tj ET`);
    pdfLines.push(`BT /F1 10 Tf ${margin} ${pageHeight - margin - 20} Td (${this.escapePdfText(creationDate)}) Tj ET`);
    yPosition -= 40;

    lines.forEach((line) => {
      const wrapped = this.wrapPdfText(line, 85);
      wrapped.forEach((wrappedLine) => {
        if (yPosition < margin) {
          pdfLines.push('');
          yPosition = pageHeight - margin;
        }
        pdfLines.push(`BT /F1 10 Tf ${margin} ${yPosition} Td (${this.escapePdfText(wrappedLine)}) Tj ET`);
        yPosition -= lineHeight;
      });
    });

    const pdfBody = pdfLines.join('\n');
    const pdfParts = [
      '%PDF-1.3',
      '1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj',
      '2 0 obj<</Type /Pages /Kids [3 0 R] /Count 1>>endobj',
      `3 0 obj<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources<</Font<</F1 4 0 R>>>> /Contents 5 0 R>>endobj`,
      '4 0 obj<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>endobj',
      `5 0 obj<</Length ${pdfBody.length}>>stream
${pdfBody}
endstream
endobj`,
      'xref',
      '0 6',
      '0000000000 65535 f ',
      '0000000010 00000 n ',
      '0000000068 00000 n ',
      '0000000125 00000 n ',
      '0000000209 00000 n ',
      'trailer<</Size 6 /Root 1 0 R>>',
      'startxref',
      '305',
      '%%EOF'
    ];
    return new Blob([pdfParts.join('\n')], { type: 'application/pdf' });
  }

  escapePdfText(text) {
    return text.replace(/([()\\])/g, '\\$1');
  }

  wrapPdfText(text, maxChars) {
    const segments = [];
    let current = text;
    while (current.length > maxChars) {
      const slice = current.slice(0, maxChars);
      const lastSpace = slice.lastIndexOf(' ');
      if (lastSpace > 0) {
        segments.push(slice.slice(0, lastSpace));
        current = current.slice(lastSpace + 1);
      } else {
        segments.push(slice);
        current = current.slice(maxChars);
      }
    }
    if (current.trim()) segments.push(current);
    return segments;
  }

  typeTextBlock(element, text) {
    let index = 0;
    const cleanText = String(text);
    element.innerHTML = '';
    const interval = setInterval(() => {
      index += 1;
      element.innerHTML = this.escapeHtml(cleanText.slice(0, index)).replace(/\n/g, '<br/>');
      element.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (index >= cleanText.length) {
        clearInterval(interval);
      }
    }, 16);
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  renderAdmin() {
    const stats = this.engine.getStatistics();
    elements.adminTotalQuestions.textContent = stats.totalQuestions;
    elements.adminTopTopic.textContent = stats.mostAsked;
    elements.adminLeastTopic.textContent = stats.leastAsked;
    elements.adminAverageScore.textContent = `${stats.averageScore}%`;
    elements.adminFallbackCount.textContent = stats.totalFallbacks;
    this.drawCategoryPie();
    this.drawDailyGraph();
  }

  drawCategoryPie() {
    const counts = this.engine.analytics.categoryCounts;
    const canvas = elements.categoryPie;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const categories = Object.keys(counts);
    if (categories.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Inter';
      ctx.fillText('No category data yet', 60, 130);
      return;
    }
    const total = categories.reduce((sum, cat) => sum + counts[cat], 0);
    let startAngle = -0.5 * Math.PI;
    categories.forEach((category, idx) => {
      const slice = counts[category] / total;
      const color = this.getColorForIndex(idx);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(130, 130);
      ctx.arc(130, 130, 110, startAngle, startAngle + slice * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      startAngle += slice * Math.PI * 2;
    });
    let y = 24;
    categories.forEach((category, idx) => {
      const color = this.getColorForIndex(idx);
      ctx.fillStyle = color;
      ctx.fillRect(12, y - 10, 12, 12);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px Inter';
      ctx.fillText(`${category}: ${counts[category]}`, 30, y);
      y += 18;
    });
  }

  drawDailyGraph() {
    const data = this.engine.analytics.dailyUsage;
    const canvas = elements.dailyGraph;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Inter';
      ctx.fillText('No daily usage yet', 180, 130);
      return;
    }
    const maxValue = Math.max(...entries.map(([, value]) => value));
    const barWidth = (canvas.width - 80) / entries.length;
    entries.forEach(([day, value], index) => {
      const x = 50 + index * barWidth;
      const barHeight = (value / maxValue) * (canvas.height - 120);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(x, canvas.height - 50 - barHeight, barWidth * 0.7, barHeight);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter';
      ctx.fillText(value, x, canvas.height - 60 - barHeight);
      ctx.fillText(day.slice(5), x, canvas.height - 20);
    });
  }

  getColorForIndex(index) {
    const palette = ['#4f46e5', '#ec4899', '#14b8a6', '#f59e0b', '#2563eb', '#10b981'];
    return palette[index % palette.length];
  }

  toggleAdmin(show) {
    elements.adminPanel.classList.toggle('hidden', !show);
    if (show) {
      this.renderAdmin();
    }
  }

  resetAnalytics() {
    localStorage.removeItem(LOCAL_STORAGE_ANALYTICS);
    this.engine.analytics = this.engine.loadAnalytics();
    this.renderAdmin();
    this.updateSessionStats();
  }
}

async function initialize() {
  try {
    initElements();
    elements.splashStatus.textContent = 'Initializing Knowledge Base...';
    console.log('App starting, window.location:', window.location.href);

    const origin = window.location.origin;
    const intentUrl = origin + '/static/data/intents.json';
    console.log('Fetching intents from:', intentUrl);

    const response = await fetch(intentUrl);
    console.log('Fetch response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Data loaded, intents count:', (data.intents || data).length || 0);

    const engine = new ChatbotEngine(data.intents || data);
    const ui = new ChatUI(engine);

    setTimeout(() => {
      elements.splashStatus.textContent = 'Ready!';
      elements.splash.classList.add('hidden');
      elements.appShell.classList.remove('hidden');
      console.log('App initialized successfully');
    }, 1000);
  } catch (error) {
    console.error('Detailed error:', error);
    if (elements && elements.splashStatus) {
      elements.splashStatus.textContent = `Error: ${error.message}`;
    }
  }
}

window.addEventListener('DOMContentLoaded', initialize);
