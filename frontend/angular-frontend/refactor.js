const fs = require('fs');
const file = 'src/app/app.ts';
let content = fs.readFileSync(file, 'utf8');
const startMatch = content.indexOf('  // --- HOME ---');
const endMatch = content.indexOf('  qState: any =');

if(startMatch !== -1 && endMatch !== -1) {
  const replacement = `  // --- HOME ---
  homeStats = this.dataService.homeStats;
  homeFeatures = this.dataService.homeFeatures;
  getFeatureTitle(title: string): string {
    if (this.currentLang() === 'en') return title;
    const hiMap: any = { History:'इतिहास', Preamble:'प्रस्तावना', 'Articles Hub':'अनुच्छेद', 'Rights & Duties':'अधिकार', 'Case Studies':'मामले', Quiz:'प्रश्नोत्तरी', Games:'खेल', 'AI Chatbot':'AI मित्र' };
    return hiMap[title] || title;
  }

  // --- HISTORY ---
  historyStats = this.dataService.historyStats;
  historyEvents = this.dataService.historyEvents;
  keyArchitects = this.dataService.keyArchitects;
  pioneersData = this.dataService.pioneersData;

  // --- PREAMBLE ---
  preambleKeywords = this.dataService.preambleKeywords;
  preambleFacts = this.dataService.preambleFacts;

  // --- ARTICLES ---
  articlesData = this.dataService.articlesData;
  filteredArticles = [...this.articlesData];
  openArticles = new Set<string>();

  filterArticles(event: any) {
    const q = event.target.value.toLowerCase();
    this.searchQuery.set(q);
    if (!q) {
      this.filteredArticles = [...this.articlesData];
      return;
    }
    this.filteredArticles = this.articlesData.filter(a => 
      a.id.includes(q) || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    );
  }
  
  // Highlight keyword
  highlightText(text: string): string {
    const q = this.searchQuery();
    if (!q) return text;
    const regex = new RegExp(\`(\${q})\`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }

  toggleArticle(id: string) {
    if (this.openArticles.has(id)) this.openArticles.delete(id);
    else this.openArticles.add(id);
  }

  // --- VOICE SEARCH ---
  isListening = signal(false);
  startVoiceSearch() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = this.currentLang() === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      this.isListening.set(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.searchQuery.set(transcript);
      this.filterArticles({ target: { value: transcript } });
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening.set(false);
    };
    
    recognition.onend = () => {
      this.isListening.set(false);
    };
    
    recognition.start();
  }

  // --- TEXT TO SPEECH ---
  speak(text: string) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.currentLang() === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  // --- RIGHTS & DUTIES ---
  activeRightsTab = 'rights';
  rightsData = this.dataService.rightsData;
  dutiesData = this.dataService.dutiesData;

  // --- CASES ---
  casesData = this.dataService.casesData;

  // --- QUIZ ---
  quizData = this.dataService.quizData;
`;
  content = content.substring(0, startMatch) + replacement + content.substring(endMatch);
  fs.writeFileSync(file, content);
  console.log('Successfully refactored app.ts');
} else {
  console.log('Could not find match', startMatch, endMatch);
}
