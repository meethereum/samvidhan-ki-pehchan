import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  constructor(
    public dataService: DataService, 
    public authService: AuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  currentLang = signal<'en' | 'hi'>('en');
  currentPage = signal('home');
  searchQuery = signal('');

  // Auto-translate using MyMemory API (free, no API key needed for basic usage)
  async translateText(text: string, toLang: string): Promise<string> {
    if (!text) return text;
    try {
      const fromLang = toLang === 'hi' ? 'en' : 'hi';
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
      const data = await res.json();
      return data.responseData?.translatedText || text;
    } catch (e) {
      console.error('Translation error', e);
      return text;
    }
  }

  async toggleLang() {
    const newLang = this.currentLang() === 'en' ? 'hi' : 'en';
    this.currentLang.set(newLang);
    // Optional: dynamically translate dynamic data if needed, though most is pre-translated
  }

  // Daily Fact State
  showDailyFact = signal(true);
  currentFactIndex = signal(Math.floor(Math.random() * 5));
  dailyFacts = [
    { en: 'The Indian Constitution is the longest written constitution in the world.', hi: 'भारतीय संविधान दुनिया का सबसे लंबा लिखित संविधान है।' },
    { en: 'It was handwritten by Prem Behari Narain Raizada in a flowing italic style.', hi: 'इसे प्रेम बिहारी नारायण रायज़ादा ने एक प्रवाहमयी इटैलिक शैली में हस्तलिखित किया था।' },
    { en: 'The original copies are kept in special helium-filled cases in the Library of the Parliament.', hi: 'मूल प्रतियां संसद के पुस्तकालय में विशेष हीलियम से भरे मामलों में रखी गई हैं।' },
    { en: 'It took 2 years, 11 months, and 18 days to completely draft it.', hi: 'इसे पूरी तरह से तैयार करने में 2 साल, 11 महीने और 18 दिन लगे।' },
    { en: 'The concept of Five Year Plans was borrowed from the USSR.', hi: 'पंचवर्षीय योजनाओं की अवधारणा यूएसएसआर से ली गई थी।' }
  ];

  nextFact() {
    this.currentFactIndex.set((this.currentFactIndex() + 1) % this.dailyFacts.length);
  }
  closeFact() {
    this.showDailyFact.set(false);
  }

  // Spin Wheel State
  wheelRotation = 0;
  isSpinning = false;
  showWheelResult = false;
  wheelResult = '';
  wheelCategories = ['Articles', 'Rights', 'Duties', 'Random Quiz', 'History', 'Preamble'];
  
  spinWheel() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.showWheelResult = false;
    const spins = 5;
    const randomDegree = Math.floor(Math.random() * 360);
    this.wheelRotation += (spins * 360) + randomDegree;
    setTimeout(() => {
      this.isSpinning = false;
      const normalizedDegree = this.wheelRotation % 360;
      const sliceAngle = 360 / this.wheelCategories.length;
      const index = Math.floor((360 - normalizedDegree + sliceAngle / 2) % 360 / sliceAngle);
      this.wheelResult = this.wheelCategories[index] || this.wheelCategories[0];
      this.showWheelResult = true;
    }, 3000);
  }

  closeWheelResult() {
    this.showWheelResult = false;
  }

  // Progress Tracking
  getProgress(): number {
    let completed = 0;
    const totalTasks = 4; // Quiz, Wordsearch, Articles opened, Chatbot used
    if (this.qState.submitted) completed++;
    if (this.wsFoundWords.length > 0) completed++;
    if (this.openArticles.size > 0) completed++;
    if (this.chatMsgs.length > 1) completed++;
    return Math.round((completed / totalTasks) * 100);
  }

  T: any = {
    en: {
      headerTitle: "Samvidhan Ki Pehchan",
      headerSub: "Constitutional Awareness Platform",
      heroTitle: "The Constitution of India",
      heroDesc: "A living document that empowers every citizen. Explore your rights, duties, and the democratic foundation of the world's largest republic.",
      preambleTitle: "THE CONSTITUTION OF INDIA",
      langBtn: "हिंदी",
      searchPlaceholder: "Search Articles, Rights, Duties...",
      noResults: "No results found for",
      startLearning: "Start Learning",
      takeQuiz: "Take Quiz",
      dailyFact: "Daily Constitutional Fact",
      nextFact: "Next Fact"
    },
    hi: {
      headerTitle: "संविधान की पहचान",
      headerSub: "संवैधानिक जागरूकता मंच",
      heroTitle: "भारत का संविधान",
      heroDesc: "एक जीवंत दस्तावेज जो हर नागरिक को सशक्त बनाता है। दुनिया के सबसे बड़े गणराज्य के अपने अधिकारों, कर्तव्यों और लोकतांत्रिक नींव का अन्वेषण करें।",
      preambleTitle: "भारत का संविधान",
      langBtn: "English",
      searchPlaceholder: "अनुच्छेद, अधिकार, कर्तव्य खोजें...",
      noResults: "इसके लिए कोई परिणाम नहीं मिला",
      startLearning: "सीखना शुरू करें",
      takeQuiz: "क्विज़ लें",
      dailyFact: "दैनिक संवैधानिक तथ्य",
      nextFact: "अगला तथ्य"
    }
  };

  showPage(page: string) {
    this.currentPage.set(page);
    window.scrollTo(0, 0);
    if (page === 'quiz' && this.qState.results.length === 0) {
      this.initQuiz();
    }
    if (page === 'games' && this.wsGrid.length === 0) {
      this.initGames();
    }
    if (page === 'chatbot' && this.chatMsgs.length === 0) {
      this.initChat();
    }
  }

  // --- HOME ---
  get homeStats() { return this.dataService.homeStats; }
  get homeFeatures() { return this.dataService.homeFeatures; }

  getFeatureTitle(title: string): string {
    if (this.currentLang() === 'en') return title;
    const hiMap: any = { History:'इतिहास', Preamble:'प्रस्तावना', 'Articles Hub':'अनुच्छेद', 'Rights & Duties':'अधिकार', 'Case Studies':'मामले', Quiz:'प्रश्नोत्तरी', Games:'खेल', 'AI Chatbot':'AI मित्र' };
    return hiMap[title] || title;
  }

  // --- HISTORY ---
  get historyStats() { return this.dataService.historyStats; }
  get historyEvents() { return this.dataService.historyEvents; }
  get keyArchitects() { return this.dataService.keyArchitects; }
  get pioneersData() { return this.dataService.pioneersData; }

  // --- PREAMBLE ---
  get preambleKeywords() { return this.dataService.preambleKeywords; }
  get preambleFacts() { return this.dataService.preambleFacts; }

  // --- ARTICLES ---
  get articlesData() { return this.dataService.articlesData; }
  filteredArticles: any[] = [];
  filteredCases: any[] = [];
  openArticles = new Set<string>();

  onSearch(event: any) {
    const q = event.target.value.toLowerCase();
    this.searchQuery.set(q);
    
    if (!q) {
      this.filteredArticles = [...this.articlesData];
      this.filteredCases = [...this.casesData];
      return;
    }

    this.filteredArticles = this.articlesData.filter((a: any) => 
      a.id.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    );

    this.filteredCases = this.casesData.filter((c: any) =>
      c.name.toLowerCase().includes(q) || c.articles.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.significance.toLowerCase().includes(q)
    );

    if (this.currentPage() !== 'articles' && this.currentPage() !== 'cases') {
      if (this.filteredCases.length > 0 && this.filteredArticles.length === 0) {
        this.currentPage.set('cases');
      } else {
        this.currentPage.set('articles');
      }
    }
  }
  
  // Highlight keyword
  highlightText(text: string): string {
    const q = this.searchQuery();
    if (!q) return text;
    const regex = new RegExp(`(${q})`, 'gi');
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
      // Manually trigger the filter using the transcribed text
      this.onSearch({ target: { value: transcript } });
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
    window.speechSynthesis.cancel(); // Stop any currently playing audio
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.currentLang() === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9; // Slightly slower for better comprehension
    window.speechSynthesis.speak(utterance);
  }

  // --- RIGHTS & DUTIES ---
  activeRightsTab = 'rights';
  get rightsData() { return this.dataService.rightsData; }
  get dutiesData() { return this.dataService.dutiesData; }

  // --- CASES ---
  get casesData() { return this.dataService.casesData; }

  // --- QUIZ ---
  get quizData() { return this.dataService.quizData; }
  qState: any = { current: 0, answered: null, submitted: false, results: [], score: 0 };

  getChar(i: number) { return String.fromCharCode(65 + i); }
  initQuiz() {
    this.qState = { current: 0, answered: null, submitted: false, results: new Array(this.quizData.length).fill(null), score: 0 };
  }
  selectAnswer(idx: number) {
    if (this.qState.answered !== null || this.qState.results[this.qState.current] !== null) return;
    this.qState.answered = idx;
    this.qState.results[this.qState.current] = idx;
  }
  quizNext() {
    if (this.qState.current === this.quizData.length - 1) {
      this.qState.score = this.qState.results.filter((r: number, i: number) => r === this.quizData[i].ans).length;
      this.qState.submitted = true;
    } else {
      this.qState.current++;
      this.qState.answered = this.qState.results[this.qState.current];
    }
  }
  quizBack() {
    if (this.qState.current > 0) {
      this.qState.current--;
      this.qState.answered = this.qState.results[this.qState.current];
    }
  }
  getPercentage(): number {
    return Math.round((this.qState.score / this.quizData.length) * 100);
  }
  getScoreMessage() {
    const pct = this.getPercentage();
    return pct === 100 ? {text:'Perfect!', icon:'emoji_events'} : pct >= 80 ? {text:'Excellent!', icon:'celebration'} : pct >= 60 ? {text:'Good job!', icon:'thumb_up'} : pct >= 40 ? {text:'Keep learning!', icon:'local_library'} : {text:'Study more!', icon:'menu_book'};
  }

  // --- GAMES ---
  activeGame = 'wordsearch';
  WS_GRID_SIZE = 12;
  WS_WORDS = [
    {word:'PREAMBLE', color:'found-1'},
    {word:'JUSTICE', color:'found-2'},
    {word:'LIBERTY', color:'found-3'},
    {word:'EQUALITY', color:'found-4'},
  ];
  wsGrid: string[][] = [];
  wsFoundWords: string[] = [];
  wsSelecting = false;
  wsStartCell: any = null;
  wsCurrentSelection: any[] = [];

  switchGame(game: string) {
    this.activeGame = game;
    if (game === 'wordsearch') this.initWordSearch();
    else this.initCrossword();
  }
  initGames() {
    this.initWordSearch();
  }

  initWordSearch() {
    this.wsGrid = Array.from({length: this.WS_GRID_SIZE}, () => Array(this.WS_GRID_SIZE).fill(''));
    this.wsFoundWords = [];
    
    this.WS_WORDS.forEach(({word}) => {
      let placed_ok = false, attempts = 0;
      while (!placed_ok && attempts < 200) {
        attempts++;
        const dir = Math.floor(Math.random() * 3);
        const row = Math.floor(Math.random() * this.WS_GRID_SIZE);
        const col = Math.floor(Math.random() * this.WS_GRID_SIZE);
        const dr = [0,1,1][dir], dc = [1,0,1][dir];
        const er = row + dr*(word.length-1), ec = col + dc*(word.length-1);
        if (er >= this.WS_GRID_SIZE || ec >= this.WS_GRID_SIZE) continue;
        let ok = true;
        for (let i=0; i<word.length; i++) {
          const c = this.wsGrid[row+dr*i][col+dc*i];
          if (c !== '' && c !== word[i]) { ok = false; break; }
        }
        if (ok) {
          for (let i=0; i<word.length; i++) this.wsGrid[row+dr*i][col+dc*i] = word[i];
          placed_ok = true;
        }
      }
    });

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r=0; r<this.WS_GRID_SIZE; r++) {
      for (let c=0; c<this.WS_GRID_SIZE; c++) {
        if (this.wsGrid[r][c] === '') this.wsGrid[r][c] = letters[Math.floor(Math.random()*26)];
      }
    }
  }
  
  wsStart(r: number, c: number) {
    this.wsSelecting = true;
    this.wsStartCell = {r,c};
    this.wsCurrentSelection = [{r,c}];
  }
  wsEnter(r: number, c: number) {
    if (!this.wsSelecting) return;
    const dr = r - this.wsStartCell.r, dc = c - this.wsStartCell.c;
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) return;
    const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
    const stepR = dr===0?0:dr>0?1:-1, stepC = dc===0?0:dc>0?1:-1;
    const sel = [];
    for (let i=0; i<len; i++) sel.push({r: this.wsStartCell.r+stepR*i, c: this.wsStartCell.c+stepC*i});
    this.wsCurrentSelection = sel;
  }
  wsEnd() {
    if (!this.wsSelecting) return;
    this.wsSelecting = false;
    const word = this.wsCurrentSelection.map(({r,c})=>this.wsGrid[r][c]).join('');
    const wordRev = word.split('').reverse().join('');
    const match = this.WS_WORDS.find(w => (w.word===word || w.word===wordRev) && !this.wsFoundWords.includes(w.word));
    
    if (match) {
      this.wsFoundWords.push(match.word);
      if (this.wsFoundWords.length === this.WS_WORDS.length) {
        setTimeout(() => alert('🎉 Excellent! You found all the words!'), 100);
      }
    }
    this.wsCurrentSelection = [];
  }
  getWsCellClass(r: number, c: number): string {
    const isSelected = this.wsCurrentSelection.some(s => s.r === r && s.c === c);
    return isSelected ? 'selected' : '';
  }

  // --- CROSSWORD ---
  cwGridMap = Array.from({length: 36}, (_, i) => i);
  cwBlacks = new Set([0,5,10,16,23,24,25,26,28,29,30,31,32,34,35]);
  cwNums: any = { 1:1, 18:3, 3:1, 6:2 };
  cwAnswersMap: any = { 1:'V',2:'O',3:'T',4:'E', 6:'L',9:'O',11:'_', 12:'A',15:'T',17:'_', 18:'E',19:'Q',20:'U',21:'E',22:'R', 27:'S', 33:'T' };
  cwValues: any = {};
  cwStyles: any = {};

  initCrossword() {
    this.cwValues = {};
    this.cwStyles = {};
    for (let i = 0; i < 36; i++) {
      if (this.cwBlacks.has(i)) this.cwStyles[i] = 'black';
    }
  }
  checkCwInput(i: number, event: any) {
    const val = event.target.value.toUpperCase();
    this.cwValues[i] = val;
    if (!val) {
      this.cwStyles[i] = '';
    } else {
      this.cwStyles[i] = (val === this.cwAnswersMap[i]) ? 'cw-correct' : 'cw-wrong';
    }
  }

  // --- CHATBOT ---
  chatInputStore = '';
  chatMsgs: any[] = [];
  isBotTyping = false;
  chatResponses: any = {
    preamble: {en:'The Preamble embodies the ideals of Justice, Liberty, Equality, and Fraternity.',hi:'प्रस्तावना न्याय, स्वतंत्रता, समानता और बंधुत्व के आदर्शों को समाहित करती है।'},
    rights: {en:'There are 6 Fundamental Rights under Part III.',hi:'भाग III के तहत 6 मौलिक अधिकार हैं।'},
    default: {en:'That\'s a great constitutional question! How else can I help?',hi:'यह एक महत्वपूर्ण संवैधानिक प्रश्न है! मैं आपकी और कैसे मदद कर सकता हूँ?'}
  };

  initChat() {
    this.chatMsgs = [{role:'bot',text:this.currentLang() === 'hi' ? 'नमस्कार! मैं संविधान मित्र हूँ — आपका संवैधानिक मार्गदर्शक।' : 'Namaskar! I am the Samvidhan Mitra — your constitutional guide.',time:new Date()}];
  }
  geminiApiKey = '';

  async sendChat() {
    const q = this.chatInputStore.trim();
    if (!q) return;
    this.chatInputStore = '';
    this.chatMsgs.push({role:'user', text:q, time:new Date()});
    this.scrollToBottom();
    this.isBotTyping = true;
    
    let finalReply = '';

    if (this.geminiApiKey) {
      try {
        const validHistoryMsgs = this.chatMsgs.filter(m => m.text && m.text !== (this.currentLang() === 'hi' ? 'नमस्कार! मैं संविधान मित्र हूँ — आपका संवैधानिक मार्गदर्शक।' : 'Namaskar! I am the Samvidhan Mitra — your constitutional guide.'));
        
        const history = validHistoryMsgs.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        
        const payload = {
          contents: history
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        finalReply = data.candidates[0].content.parts[0].text;
      } catch (err) {
        console.error(err);
        finalReply = 'Sorry, there was an error connecting to the AI model.';
      }
    } else {
      const replyEn = this.getBotReplyEn(q);
      finalReply = replyEn;
      if (this.currentLang() === 'hi') {
        finalReply = await this.translateText(replyEn, 'hi');
      }
      finalReply = "⚠️ [AI Key Missing - Using Basic Rules]\n" + finalReply;
    }

    this.isBotTyping = false;
    this.chatMsgs.push({role:'bot', text:finalReply, time:new Date()});
    this.scrollToBottom();
  }
  sendQuickChat(q: string) {
    this.chatInputStore = q;
    this.sendChat();
  }
  getBotReplyEn(q: string) {
    const l = q.toLowerCase();
    if (l.includes('preamble')) return 'The Preamble embodies the ideals of Justice, Liberty, Equality, and Fraternity.';
    if (l.includes('right')) return 'There are 6 Fundamental Rights under Part III of the Constitution.';
    if (l.includes('duty') || l.includes('duties')) return 'There are 11 Fundamental Duties under Article 51A.';
    return 'That is a great constitutional question! What else would you like to explore?';
  }
  scrollToBottom() {
    setTimeout(() => {
      const c = document.getElementById('chat-msgs-container');
      if (c) c.scrollTop = c.scrollHeight;
    }, 100);
  }

  ngOnInit() {
    this.filteredArticles = [...this.articlesData];
    this.filteredCases = [...this.casesData];
    this.initQuiz();
    this.initGames();
    this.initChat();
  }
}
