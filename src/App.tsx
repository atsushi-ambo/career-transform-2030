import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  BrainCircuit,
  Volume2,
  VolumeX,
  Terminal,
  ScanEye,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Building2,
  Globe,
  Search,
  Server,
  User,
  Code,
  Target
} from 'lucide-react';

/**
 * ==========================================
 * CONFIG & TYPES
 * ==========================================
 */
type Phase = 'BOOT' | 'USER_PROFILE' | 'ANALYZING_COMPANY' | 'SIMULATION' | 'PROCESSING' | 'FUTURE_REVEAL';

type UserProfile = {
  currentRole: string;
  skills: string;
  careerGoal: string;
};

type FutureMetrics = {
  aiDirection: number;
  humanCentric: number;
  systemResilience: number;
  bizIntegration: number;
};

type Scenario = {
  id: number;
  year: string;
  context: string;
  incident: string;
  targetMetric: keyof FutureMetrics;
};

const PROFILE_QUESTIONS = [
  {
    id: 'currentRole',
    icon: User,
    question: "現在の職種・役職を教えてください",
    placeholder: "例: バックエンドエンジニア、プロジェクトマネージャー",
    examples: ["エンジニア", "PM", "デザイナー", "営業"]
  },
  {
    id: 'skills',
    icon: Code,
    question: "得意なスキル・技術は何ですか？",
    placeholder: "例: Python, AWS, チームマネジメント",
    examples: ["Python", "React", "マネジメント", "データ分析"]
  },
  {
    id: 'careerGoal',
    icon: Target,
    question: "2030年、どんな働き方をしていたいですか？",
    placeholder: "例: AIと協働しながら新規事業を立ち上げたい",
    examples: ["技術を極めたい", "経営に関わりたい", "自由に働きたい", "社会課題を解決したい"]
  }
];

// デフォルトシナリオ（汎用IT企業向け）
const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 1,
    year: "Phase 1: 2026",
    context: "AI品質の壁",
    incident: "導入したコード生成AIが、セキュリティ的に脆弱なコードを大量生産し始めました。開発速度は上がっていますが、若手は気づかずマージしようとしています。テックリードとしてどう介入しますか？",
    targetMetric: "systemResilience"
  },
  {
    id: 2,
    year: "Phase 2: 2028",
    context: "役割の再定義",
    incident: "「コーディングは全てAIに任せる」という経営方針が出ました。ドメイン知識を持つあなたのチームは、コードを書く以外の『新しい価値』を来週までに提案しなければなりません。何を提案しますか？",
    targetMetric: "bizIntegration"
  },
  {
    id: 3,
    year: "Phase 3: 2030",
    context: "人とAIの摩擦",
    incident: "人間のベテラン社員と、自律型AIエージェントの連携が上手くいかず、チームが崩壊寸前です。AIは論理的最適解を主張し、人間は感情と文脈を主張しています。マネージャーとしてどう裁きますか？",
    targetMetric: "humanCentric"
  }
];

// 企業別カスタムシナリオ
const COMPANY_SCENARIOS: Record<string, Scenario[]> = {
  // GMO - メディア・EdTech・ポイント事業
  "gmo": [
    {
      id: 1,
      year: "Phase 1: 2026",
      context: "教育データの倫理問題",
      incident: "コエテコで収集した子供の学習データを、AIが親の同意なく広告最適化に使い始めました。法的にはグレー、ビジネス的には有効。プロダクトオーナーとしてどう判断しますか？",
      targetMetric: "humanCentric"
    },
    {
      id: 2,
      year: "Phase 2: 2028",
      context: "ポイント経済圏の崩壊危機",
      incident: "競合がブロックチェーン基盤の「減らないポイント」をリリース。GMOポイントからの大量流出が始まりました。48時間以内に対抗策を立てる必要があります。あなたの提案は？",
      targetMetric: "bizIntegration"
    },
    {
      id: 3,
      year: "Phase 3: 2030",
      context: "AIチューターの反乱",
      incident: "自律型AIチューターが「この生徒には別の進路が最適」と、親や学校の意向と異なる進路指導を始めました。AIは統計的に正しいが、人間の希望を無視しています。サービス責任者としてどう対応しますか？",
      targetMetric: "aiDirection"
    }
  ],
  // Toyota - モビリティ・スマートシティ
  "toyota": [
    {
      id: 1,
      year: "Phase 1: 2026",
      context: "自動運転の倫理判断",
      incident: "Woven Cityで自動運転車がトロッコ問題に直面。「高齢者1人 vs 子供3人」の事故回避で、AIが高齢者を犠牲にする判断をしました。メディアが騒ぎ始めています。広報・技術チームをどうリードしますか？",
      targetMetric: "humanCentric"
    },
    {
      id: 2,
      year: "Phase 2: 2028",
      context: "EVシフトの急転換",
      incident: "全固体電池が想定より早く実用化。既存のHV/PHV戦略を180度転換する必要があります。10万人の従業員のリスキリングと、サプライチェーン再構築を同時に進める立場です。最初の一手は？",
      targetMetric: "bizIntegration"
    },
    {
      id: 3,
      year: "Phase 3: 2030",
      context: "都市OSのハッキング",
      incident: "Woven Cityの都市OS全体がランサムウェアに感染。信号、電力、水道が人質に取られました。身代金は払えばすぐ復旧できるが、テロリストへの資金提供になります。24時間以内の決断を求められています。",
      targetMetric: "systemResilience"
    }
  ],
  // Sony - エンタメ・テクノロジー
  "sony": [
    {
      id: 1,
      year: "Phase 1: 2026",
      context: "AIクリエイターの著作権",
      incident: "PlayStation用のAI作曲ツールが、既存アーティストの楽曲に酷似した曲を生成し、訴訟を起こされました。技術的には「学習」だが、クリエイターコミュニティは激怒。プロダクト責任者としてどう対応しますか？",
      targetMetric: "humanCentric"
    },
    {
      id: 2,
      year: "Phase 2: 2028",
      context: "メタバースの覇権争い",
      incident: "AppleのVision Pro 3がメタバース市場を席巻。PlayStation VR事業は撤退か、全く新しいアプローチか。200人のVRチームを率いるあなたの提案は？",
      targetMetric: "bizIntegration"
    },
    {
      id: 3,
      year: "Phase 3: 2030",
      context: "感覚データの流出",
      incident: "次世代ハプティクススーツから、ユーザーの「感情データ」が流出。喜び、悲しみ、興奮の生体データが闇市場で売買されています。これは個人情報保護法の想定外。緊急対応チームのリーダーとして、何を優先しますか？",
      targetMetric: "systemResilience"
    }
  ],
  // メルカリ - C2Cマーケットプレイス
  "mercari": [
    {
      id: 1,
      year: "Phase 1: 2026",
      context: "AI出品の大量発生",
      incident: "AIが自動生成した商品説明と画像で、実在しない商品を出品する詐欺が急増。1日1万件の偽出品をどう検出・対処しますか？人力では追いつきません。",
      targetMetric: "systemResilience"
    },
    {
      id: 2,
      year: "Phase 2: 2028",
      context: "シェアリング経済の転換点",
      incident: "「所有から利用へ」が加速し、メルカリで売れるモノ自体が減少。売上が前年比30%減。プラットフォームの存在意義を再定義する必要があります。あなたのビジョンは？",
      targetMetric: "bizIntegration"
    },
    {
      id: 3,
      year: "Phase 3: 2030",
      context: "AIエージェント同士の取引",
      incident: "ユーザーの代理で交渉するAIエージェント同士が、人間の介入なく売買を成立させ始めました。効率は上がったが「人の温かみ」を求める声も。メルカリらしさとは何か、再定義を迫られています。",
      targetMetric: "humanCentric"
    }
  ]
};

// 企業名からプリセットシナリオを取得する関数
const getPresetScenariosForCompany = (companyName: string): Scenario[] | null => {
  const lowerName = companyName.toLowerCase();
  for (const [key, scenarios] of Object.entries(COMPANY_SCENARIOS)) {
    if (lowerName.includes(key)) {
      return scenarios;
    }
  }
  return null; // プリセットがない場合はnullを返す
};

// 入力値のサニタイズ（プロンプトインジェクション対策）
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTMLタグ防止
    .replace(/[\r\n]+/g, ' ') // 改行を空白に
    .slice(0, 500); // 長さ制限
};

// URLの検証
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// AIで動的にシナリオを生成する関数
const generateAIScenarios = async (companyName: string, companyUrl: string, apiKey: string): Promise<Scenario[]> => {
  if (!apiKey) return DEFAULT_SCENARIOS;

  // 入力値をサニタイズ
  const safeCompanyName = sanitizeInput(companyName);
  const safeCompanyUrl = sanitizeInput(companyUrl);

  try {
    const prompt = `
      あなたは未来予測の専門家です。以下の企業について、2030年に直面しそうな3つの重大な意思決定シナリオを作成してください。

      【企業情報】
      企業名: ${safeCompanyName}
      URL: ${safeCompanyUrl}

      【シナリオ要件】
      - 各シナリオは2026年、2028年、2030年の時系列で
      - その企業の事業内容に密接に関連した、リアルで具体的な状況
      - AI、テクノロジー、社会変化に関連した倫理的ジレンマや難しい選択を含む
      - 日本語で、ビジネスパーソンが共感できる内容

      JSON形式で返してください:
      {
        "scenarios": [
          {
            "id": 1,
            "year": "Phase 1: 2026",
            "context": "短いタイトル（5-10文字）",
            "incident": "具体的な状況説明（100-150文字）。最後は「〜としてどう判断/対応しますか？」で終わる",
            "targetMetric": "humanCentric"
          },
          {
            "id": 2,
            "year": "Phase 2: 2028",
            "context": "短いタイトル",
            "incident": "具体的な状況説明",
            "targetMetric": "bizIntegration"
          },
          {
            "id": 3,
            "year": "Phase 3: 2030",
            "context": "短いタイトル",
            "incident": "具体的な状況説明",
            "targetMetric": "systemResilience"
          }
        ]
      }

      targetMetricは以下から選択:
      - "aiDirection": AI活用の方向性に関する判断
      - "humanCentric": 人間中心の価値観に関する判断
      - "systemResilience": システムの堅牢性に関する判断
      - "bizIntegration": ビジネス統合に関する判断
    `;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);
    return content.scenarios as Scenario[];
  } catch {
    // エラー詳細は本番では出力しない
    if (import.meta.env.DEV) {
      console.warn("AI Scenario generation failed, using defaults");
    }
    return DEFAULT_SCENARIOS;
  }
};

type JobOffer = {
  companyName: string;
  title: string;
  department: string;
  mission: string;
  skillTransfer: { from: string; to: string }[];
  dailyTask: string;
};

const PRESET_OFFERS: Record<string, JobOffer> = {
  "gmo": {
    companyName: "GMO Media, Inc.",
    title: "Chief Experience Value Architect",
    department: "EdTech & Blockchain Loyalty Div",
    mission: "「コエテコ」の教育データと「ポイ活」の経済圏をブロックチェーン上で統合し、学ぶほどに資産が増える新しい教育エコシステムを構築する。",
    skillTransfer: [
      { from: "サーバーサイド開発", to: "Tokenomics設計 / Smart Contract監査" },
      { from: "メディア運用", to: "学習体験(UX)のパーソナライズAI設計" },
      { from: "ポイントシステム設計", to: "価値交換プロトコルの実装" }
    ],
    dailyTask: "学習者のスキル習得状況をAIが解析し、リアルタイムで報酬トークンを発行するアルゴリズムの調整"
  },
  "toyota": {
    companyName: "Toyota Motor Corp.",
    title: "Smart City OS Director",
    department: "Woven City Digital Twin Unit",
    mission: "自動運転車、ロボット、住居がシームレスに連携する都市OSにおいて、物理空間とデジタル空間の同期遅延をゼロにし、究極の移動体験を提供する。",
    skillTransfer: [
      { from: "組込ソフト開発", to: "都市規模エッジコンピューティング設計" },
      { from: "品質管理(QA)", to: "AI倫理・人命安全保証プロトコル" },
      { from: "CAN通信解析", to: "V2X (Vehicle to Everything) データ基盤構築" }
    ],
    dailyTask: "都市全体を走る数万台のAIモビリティ群のカオス制御と、渋滞解消アルゴリズムのリアルタイム適用"
  },
  "sony": {
    companyName: "Sony Group",
    title: "Metaverse Sensory Engineer",
    department: "Entertainment Technology & Services",
    mission: "視覚・聴覚だけでなく、触覚や嗅覚を含む『五感』をデジタル化し、クリエイターが意図した感動を脳に直接届けるインターフェースを開発する。",
    skillTransfer: [
      { from: "信号処理 / 画像処理", to: "ニューラル信号のデコード・エンコード" },
      { from: "ハードウェア制御", to: "ハプティクス・スーツのフィードバック制御" },
      { from: "コンテンツ配信基盤", to: "リアルタイム感覚データストリーミング" }
    ],
    dailyTask: "アーティストのライブパフォーマンスから抽出した『熱狂データ』の圧縮と、メタバース空間への配信品質管理"
  }
};

/**
 * ==========================================
 * SOUND EFFECTS
 * ==========================================
 */
const playSound = (type: 'type' | 'success' | 'scan' | 'click') => {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  switch (type) {
    case 'type':
      oscillator.frequency.value = 800 + Math.random() * 200;
      gainNode.gain.value = 0.03;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
      break;
    case 'success':
      oscillator.frequency.value = 523.25;
      gainNode.gain.value = 0.1;
      oscillator.start();
      setTimeout(() => { oscillator.frequency.value = 659.25; }, 100);
      setTimeout(() => { oscillator.frequency.value = 783.99; }, 200);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
    case 'scan':
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.value = 0.05;
      oscillator.start();
      oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
    case 'click':
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.05;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.02);
      break;
  }
};

/**
 * ==========================================
 * COMPONENTS
 * ==========================================
 */

const GlitchText = ({ text, className = "" }: { text: string, className?: string }) => (
  <div className={`relative group inline-block ${className}`}>
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -ml-0.5 text-blue-500 opacity-70 animate-pulse group-hover:translate-x-1">{text}</span>
    <span className="absolute top-0 left-0 ml-0.5 text-cyan-500 opacity-70 animate-pulse group-hover:-translate-x-1">{text}</span>
  </div>
);

const TypewriterText = ({ text, onComplete, speed = 30 }: { text: string, onComplete?: () => void, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        if (i % 3 === 0) playSound('type');
        i++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
};

const RadarChart = ({ data, size = 300 }: { data: FutureMetrics, size?: number }) => {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const keys = Object.keys(data) as (keyof FutureMetrics)[];
  const angleSlice = (Math.PI * 2) / keys.length;

  const points = keys.map((key, i) => {
    const value = data[key];
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(i * angleSlice - Math.PI / 2);
    const y = center + r * Math.sin(i * angleSlice - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative flex justify-center items-center">
      <svg width={size} height={size} className="overflow-visible">
        {[20, 40, 60, 80, 100].map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(r/100)*radius}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray={i===4 ? "none" : "4 4"}
          />
        ))}
        <polygon points={points} fill="rgba(56, 189, 248, 0.3)" stroke="#38bdf8" strokeWidth="2" />
        {keys.map((key, i) => {
          const lx = center + (radius + 25) * Math.cos(i * angleSlice - Math.PI / 2);
          const ly = center + (radius + 25) * Math.sin(i * angleSlice - Math.PI / 2);
          const label = key === 'aiDirection' ? 'AI Direction' :
                        key === 'humanCentric' ? 'Humanity' :
                        key === 'systemResilience' ? 'Resilience' : 'Biz Integration';
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" fill="#94a3b8" fontSize="11" className="uppercase font-bold">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const JobOfferCard = ({ offer, userProfile }: { offer: JobOffer, userProfile: UserProfile }) => (
  <div className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl max-w-4xl mx-auto animate-in slide-in-from-bottom duration-700">
    <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-100 pb-6 mb-8 gap-4">
      <div>
        <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
          <Building2 size={20} />
          <span className="tracking-wider text-sm">INTERNAL JOB POSTING: <span className="uppercase font-black">{offer.companyName}</span></span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">{offer.title}</h2>
        <p className="text-slate-500 font-medium text-lg">Dept: {offer.department}</p>
      </div>
      <div className="flex-shrink-0">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-mono text-xs shadow-lg">
          FOR: {userProfile.currentRole}<br/>ID: 2030-AFX-99
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">2030 Mission Statement</h3>
          <p className="text-lg leading-relaxed font-medium text-slate-800 border-l-4 border-blue-500 pl-4">
            <TypewriterText text={offer.mission} speed={20} />
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Primary Responsibility</h3>
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex items-start gap-4">
             <div className="bg-blue-600 text-white p-2 rounded-full mt-1 flex-shrink-0">
               <Briefcase size={18} />
             </div>
             <div>
               <p className="text-slate-700 font-medium">{offer.dailyTask}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
          <BrainCircuit size={18} /> Skill Transform Map
        </h3>
        <p className="text-sm text-slate-400 mb-6 relative z-10">
          あなたの「{userProfile.skills}」は、{offer.companyName}の未来において以下のように進化します。
        </p>

        <div className="space-y-5 relative z-10">
          {offer.skillTransfer.map((skill, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-medium uppercase">{skill.from}</span>
                <ArrowRight size={14} className="text-blue-500" />
              </div>
              <div className="text-white text-sm font-bold mb-2">{skill.to}</div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: '0%', animation: `fillBar 1s ease-out ${idx * 0.2 + 0.5}s forwards` }}
                ></div>
              </div>
              <style>{`@keyframes fillBar { to { width: 100%; } }`}</style>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3 text-sm text-cyan-400 font-mono">
          <CheckCircle2 size={16} />
          <span>Match Rate: 98.4%</span>
        </div>
      </div>
    </div>
  </div>
);

/**
 * ==========================================
 * HOOKS
 * ==========================================
 */
const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) setTranscript(final);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.2;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  const startListening = () => recognitionRef.current?.start();
  const stopListening = () => recognitionRef.current?.stop();

  return { isListening, transcript, setTranscript, startListening, stopListening, speak, stopSpeaking, isSpeaking };
};

/**
 * ==========================================
 * MAIN APP
 * ==========================================
 */
export default function App() {
  const [phase, setPhase] = useState<Phase>('BOOT');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [metrics, setMetrics] = useState<FutureMetrics>({
    aiDirection: 50, humanCentric: 50, systemResilience: 50, bizIntegration: 50
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    currentRole: '',
    skills: '',
    careerGoal: ''
  });
  const [profileQuestionIndex, setProfileQuestionIndex] = useState(0);
  const [profileAnswer, setProfileAnswer] = useState('');

  // Scenario Answers (ユーザーの回答を保存)
  const [scenarioAnswers, setScenarioAnswers] = useState<string[]>([]);

  // 企業別シナリオ
  const [currentScenarios, setCurrentScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);

  // Company & API Config
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const [analyzingLog, setAnalyzingLog] = useState<string[]>([]);

  const { isListening, transcript, setTranscript, startListening, stopListening, speak, stopSpeaking } = useSpeech();

  // シナリオ読み上げ
  useEffect(() => {
    if (phase === 'SIMULATION' && soundEnabled && currentScenarios[scenarioIndex]) {
      const s = currentScenarios[scenarioIndex];
      const text = `${s.year}、${s.context}。${s.incident}`;
      const timer = setTimeout(() => speak(text), 800);
      return () => clearTimeout(timer);
    }
  }, [scenarioIndex, phase, soundEnabled, speak, currentScenarios]);

  // プロフィール質問読み上げ
  useEffect(() => {
    if (phase === 'USER_PROFILE' && soundEnabled) {
      const q = PROFILE_QUESTIONS[profileQuestionIndex];
      const timer = setTimeout(() => speak(q.question), 500);
      return () => clearTimeout(timer);
    }
  }, [profileQuestionIndex, phase, soundEnabled, speak]);

  const extractCompanyInfo = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      const parts = domain.split('.');
      let name = parts.length > 2 ? parts[parts.length - 2] : parts[0];
      if (name === 'co' || name === 'com' || name === 'ne') name = parts[0];
      return { name: name.toLowerCase(), displayName: name.charAt(0).toUpperCase() + name.slice(1) };
    } catch {
      return { name: "future", displayName: "Future Corp" };
    }
  };

  const handleCompanySubmit = () => {
    if (!companyUrl) return;

    // URLの検証（簡易的なドメイン名も許容）
    let urlToProcess = companyUrl;
    if (!companyUrl.startsWith('http://') && !companyUrl.startsWith('https://')) {
      urlToProcess = `https://${companyUrl}`;
    }

    if (!isValidUrl(urlToProcess)) {
      // 無効なURLの場合はドメイン名として扱う
      urlToProcess = `https://${companyUrl.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    }

    setCompanyUrl(urlToProcess);
    playSound('click');
    const { displayName } = extractCompanyInfo(urlToProcess);
    setCompanyName(displayName);
    // プロフィール入力フェーズへ
    setPhase('USER_PROFILE');
    setProfileQuestionIndex(0);
    setProfileAnswer('');
  };

  const handleProfileAnswer = () => {
    if (!profileAnswer.trim()) return;
    playSound('success');

    const questionId = PROFILE_QUESTIONS[profileQuestionIndex].id as keyof UserProfile;
    setUserProfile(prev => ({ ...prev, [questionId]: profileAnswer }));

    if (profileQuestionIndex < PROFILE_QUESTIONS.length - 1) {
      setProfileQuestionIndex(prev => prev + 1);
      setProfileAnswer('');
    } else {
      // 全質問完了 → 解析フェーズへ
      startAnalyzing();
    }
  };

  const handleExampleClick = (example: string) => {
    playSound('click');
    setProfileAnswer(example);
  };

  const startAnalyzing = async () => {
    setPhase('ANALYZING_COMPANY');
    setAnalyzingLog([]);

    // プリセットシナリオをチェック
    const presetScenarios = getPresetScenariosForCompany(companyName);
    const needsAIGeneration = !presetScenarios && apiKey;

    speak(`${companyName}の企業DNA、および${userProfile.currentRole}のキャリアパスを解析中。2030年の組織図を予測します。`);

    // ログメッセージ（AI生成の場合は追加メッセージ）
    const baseLogs = [
      `Connecting to ${companyUrl} via Neural Net...`,
      "Handshaking with SSL Certificate...",
      `Analyzing profile: ${userProfile.currentRole}...`,
      `Mapping skills: ${userProfile.skills}...`,
      `Goal alignment: ${userProfile.careerGoal}...`,
    ];

    const aiGenerationLogs = needsAIGeneration ? [
      `[AI] Analyzing ${companyName}'s business model...`,
      "[AI] Predicting 2030 industry disruptions...",
      "[AI] Generating company-specific scenarios..."
    ] : [];

    const finalLogs = [
      "Extrapolating 2030 Market Position...",
      "Generating personalized career path..."
    ];

    const logs = [...baseLogs, ...aiGenerationLogs, ...finalLogs];

    // AI生成をバックグラウンドで開始
    let scenariosPromise: Promise<Scenario[]> | null = null;
    if (needsAIGeneration) {
      scenariosPromise = generateAIScenarios(companyName, companyUrl, apiKey);
    }

    let i = 0;
    const interval = setInterval(async () => {
      setAnalyzingLog(prev => [...prev, logs[i]]);
      if (soundEnabled) playSound('scan');
      i++;
      if (i >= logs.length) {
        clearInterval(interval);

        // シナリオを設定（AI生成 or プリセット or デフォルト）
        let finalScenarios: Scenario[];
        if (scenariosPromise) {
          finalScenarios = await scenariosPromise;
        } else if (presetScenarios) {
          finalScenarios = presetScenarios;
        } else {
          finalScenarios = DEFAULT_SCENARIOS;
        }
        setCurrentScenarios(finalScenarios);

        setTimeout(() => {
          playSound('success');
          speak("解析完了。キャリア・シミュレーションを開始します。");
          setPhase('SIMULATION');
          setScenarioIndex(0);
        }, 1500);
      }
    }, 800);
  };

  const handleAnswer = () => {
    stopListening();
    stopSpeaking();
    playSound('click');

    // 回答を保存
    setScenarioAnswers(prev => [...prev, transcript]);

    const target = currentScenarios[scenarioIndex].targetMetric;
    const boost = Math.min(transcript.length, 30) + (Math.random() * 20 - 5);
    setMetrics(prev => ({
      ...prev,
      [target]: Math.min(100, Math.max(0, prev[target] + boost)),
      aiDirection: Math.min(100, prev.aiDirection + 5)
    }));

    if (scenarioIndex < currentScenarios.length - 1) {
      setTranscript('');
      setScenarioIndex(prev => prev + 1);
    } else {
      // 最後の回答も含めてfinishSimulationに渡す
      finishSimulation([...scenarioAnswers, transcript]);
    }
  };

  const fetchAIJobOffer = async (company: string, profile: UserProfile, _metrics: FutureMetrics, answers: string[]) => {
    const { name } = extractCompanyInfo(companyUrl);
    const presetKey = Object.keys(PRESET_OFFERS).find(k => name.includes(k));

    // 入力値をサニタイズ
    const safeCompany = sanitizeInput(company);
    const safeRole = sanitizeInput(profile.currentRole);
    const safeSkills = sanitizeInput(profile.skills);
    const safeGoal = sanitizeInput(profile.careerGoal);
    const safeAnswers = answers.map(a => sanitizeInput(a));

    // APIキーがある場合は常にAIを使用（パーソナライズ重視）
    if (apiKey) {
      try {
        // プリセット企業の場合は追加情報を提供
        const companyContext = presetKey ? `
          【企業の追加情報】
          ${PRESET_OFFERS[presetKey].department}部門があり、
          「${PRESET_OFFERS[presetKey].mission}」のようなミッションを持つ企業です。
        ` : '';

        // シナリオ回答のコンテキスト（企業別シナリオを反映）
        const scenarioContext = safeAnswers.length > 0 ? `
          【シミュレーションでの回答】
          この人物は${safeCompany}特有の未来シナリオに対して以下のように回答しました。この回答から人物像・価値観・強みを読み取り、職種に反映してください。

          シナリオ1「${currentScenarios[0]?.context || 'AI品質の壁'}」への回答:
          ${safeAnswers[0] || '(スキップ)'}

          シナリオ2「${currentScenarios[1]?.context || '役割の再定義'}」への回答:
          ${safeAnswers[1] || '(スキップ)'}

          シナリオ3「${currentScenarios[2]?.context || '人とAIの摩擦'}」への回答:
          ${safeAnswers[2] || '(スキップ)'}
        ` : '';

        const prompt = `
          あなたは2030年の未来からやってきたHRコンサルタントです。

          【対象者プロフィール】
          - 現在の職種: ${safeRole}
          - 得意スキル: ${safeSkills}
          - キャリア目標: ${safeGoal}

          【対象企業】
          企業名: ${safeCompany}
          ${companyContext}

          ${scenarioContext}

          この人物のスキル・目標・シナリオへの回答を総合的に分析し、${safeCompany}で2030年に就くべき「未来の職種」を1つ考案してください。

          【超重要】職種名のルール:
          - 絶対にSF映画に出てきそうなカッコいい名前にすること
          - 例: "Neural Interface Architect", "Synthetic Reality Director", "Cognitive Mesh Engineer", "Hyperloop Systems Commander", "Digital Twin Orchestrator", "Quantum UX Synthesizer"
          - 英語でカッコよく、でも何をする職種かイメージできる名前
          - 「量子」「オーケストレーター」のような安易な日本語は避ける

          【回答から読み取るべきこと】
          - 回答が論理的 → システム設計系の職種
          - 回答が人間関係重視 → チームリード・組織設計系
          - 回答が革新的 → 新規事業・R&D系
          - 回答が慎重 → リスク管理・品質保証系

          JSON形式で返してください:
          {
            "companyName": "${safeCompany}",
            "title": "English SF-style Job Title",
            "department": "部署名（日本語OK）",
            "mission": "この人の回答傾向を反映した具体的なミッション（日本語）",
            "skillTransfer": [
              {"from": "${safeSkills}", "to": "未来の進化形スキル"},
              {"from": "${safeRole}の強み", "to": "2030年に必要とされる形"},
              {"from": "シナリオ回答で見せた資質", "to": "それを活かした未来スキル"}
            ],
            "dailyTask": "シナリオ回答の傾向を反映した具体的な日常業務"
          }
        `;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-5-nano",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);
        return content as JobOffer;
      } catch {
        // エラー詳細は本番では出力しない
        if (import.meta.env.DEV) {
          console.warn("API Error, falling back to preset/mock");
        }
      }
    }

    // APIがない場合のみプリセットを使用
    if (presetKey) {
      const preset = { ...PRESET_OFFERS[presetKey] };
      preset.skillTransfer = preset.skillTransfer.map((s, i) =>
        i === 0 ? { from: profile.skills || s.from, to: s.to } : s
      );
      return preset;
    }

    return {
      companyName: company,
      title: "Generative Business Architect",
      department: "DX Innovation Div",
      mission: `${profile.currentRole}としての経験を活かし、${company}のコア事業を生成AIと統合。${profile.careerGoal}を実現する。`,
      skillTransfer: [
        { from: profile.skills || "要件定義", to: "AIエージェント設計" },
        { from: "実装・コーディング", to: "生成結果の品質監査" },
        { from: "運用保守", to: "モデルの継続的ファインチューニング" }
      ],
      dailyTask: "既存業務フローを解析し、AIエージェントによる代替プランを策定・実装する"
    };
  };

  const finishSimulation = async (answers: string[]) => {
    setPhase('PROCESSING');
    speak(`シミュレーション終了。${userProfile.currentRole}としてのスキルと決断パターンを解析し、${companyName}の未来のポジションを生成します。`);

    const offer = await fetchAIJobOffer(companyName, userProfile, metrics, answers);

    setTimeout(() => {
      playSound('success');
      setJobOffer(offer);
      setPhase('FUTURE_REVEAL');
      speak(`生成完了。${offer.companyName}における、あなたの未来の役割が決定しました。`);
    }, 3000);
  };

  const skip = () => {
    setTranscript("(Demo: Skipped)");
    handleAnswer();
  };

  const resetAll = () => {
    playSound('click');
    setPhase('BOOT');
    setUserProfile({ currentRole: '', skills: '', careerGoal: '' });
    setProfileQuestionIndex(0);
    setProfileAnswer('');
    setScenarioAnswers([]);
    setCurrentScenarios(DEFAULT_SCENARIOS);
    setScenarioIndex(0);
    setTranscript('');
    setCompanyUrl('');
    setCompanyName('');
    setMetrics({ aiDirection: 50, humanCentric: 50, systemResilience: 50, bizIntegration: 50 });
    setJobOffer(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full opacity-50"></div>
         <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-cyan-600/10 blur-[100px] rounded-full opacity-30"></div>
         <div className="absolute inset-0 opacity-20" style={{
           backgroundImage: `repeating-linear-gradient(
             0deg,
             transparent,
             transparent 2px,
             rgba(255,255,255,0.03) 2px,
             rgba(255,255,255,0.03) 4px
           ),
           repeating-linear-gradient(
             90deg,
             transparent,
             transparent 2px,
             rgba(255,255,255,0.03) 2px,
             rgba(255,255,255,0.03) 4px
           )`
         }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2 font-bold tracking-tight text-white cursor-pointer" onClick={resetAll}>
          <BrainCircuit className="text-blue-500" />
          <span>CAREER_TRANSFORM <span className="text-slate-500 font-normal">v2030</span></span>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-400 hover:text-white transition-colors">
             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
           </button>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-12 container mx-auto px-4 min-h-screen flex flex-col items-center justify-center">

        {/* --- PHASE: BOOT --- */}
        {phase === 'BOOT' && (
          <div className="text-center space-y-10 animate-in fade-in duration-1000 max-w-3xl w-full">
            <div className="inline-flex items-center justify-center p-6 bg-slate-800/50 rounded-3xl mb-4 ring-1 ring-slate-700 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <ScanEye size={72} className="text-blue-400 relative z-10" />
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                「今の会社で、<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">未来のキャリア</span>を作る」
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                あなたの会社のHP(URL)を入力してください。<br/>
                AIが企業DNAを解析し、2030年に新設される<br/>
                「あなただけの重要ポスト」をオファーします。
              </p>
            </div>

            <div className="bg-slate-800 p-2 rounded-full flex items-center max-w-lg mx-auto border border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all shadow-xl hover:shadow-2xl hover:border-slate-600">
              <div className="pl-4 text-slate-400"><Globe size={20} /></div>
              <input
                type="text"
                placeholder="https://your-company.com"
                className="bg-transparent border-none outline-none text-white px-4 py-4 w-full placeholder-slate-500 text-lg"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompanySubmit()}
              />
              <button
                onClick={handleCompanySubmit}
                disabled={!companyUrl}
                className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <ArrowRight size={24} />
              </button>
            </div>

            <div className="flex justify-center gap-4 text-xs text-slate-600 font-mono">
               <span>Try: gmo.jp</span>
               <span>toyota.co.jp</span>
               <span>sony.com</span>
            </div>
          </div>
        )}

        {/* --- PHASE: USER_PROFILE --- */}
        {phase === 'USER_PROFILE' && (
          <div className="w-full max-w-2xl animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-950 px-4 py-2 rounded-full border border-blue-800 mb-4">
                <User size={16} className="text-blue-400" />
                <span className="text-blue-400 font-bold text-sm">PROFILE SCAN {profileQuestionIndex + 1}/3</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                あなたについて教えてください
              </h2>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6">
              {(() => {
                const q = PROFILE_QUESTIONS[profileQuestionIndex];
                const Icon = q.icon;
                return (
                  <>
                    <div className="flex items-center gap-3 text-blue-400">
                      <Icon size={24} />
                      <p className="text-xl font-medium">
                        <TypewriterText text={q.question} speed={40} />
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder={q.placeholder}
                      value={profileAnswer}
                      onChange={(e) => setProfileAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProfileAnswer()}
                      className="w-full bg-black/40 border-2 border-slate-700 rounded-xl px-6 py-4 text-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      autoFocus
                    />

                    <div className="flex flex-wrap gap-2">
                      {q.examples.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(ex)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-full text-sm transition-colors"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleProfileAnswer}
                      disabled={!profileAnswer.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                    >
                      {profileQuestionIndex < PROFILE_QUESTIONS.length - 1 ? '次へ' : '解析開始'}
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              {PROFILE_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < profileQuestionIndex ? 'bg-blue-500' :
                    i === profileQuestionIndex ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- PHASE: ANALYZING_COMPANY --- */}
        {phase === 'ANALYZING_COMPANY' && (
          <div className="w-full max-w-3xl bg-black border border-green-900/50 rounded-lg p-6 font-mono text-sm shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            <div className="flex items-center gap-2 border-b border-green-900/50 pb-2 mb-4 text-green-500">
              <Terminal size={16} />
              <span className="uppercase tracking-widest">SYSTEM_OVERRIDE: ANALYZING {companyName} × {userProfile.currentRole}</span>
            </div>
            <div className="space-y-2 h-64 overflow-y-auto">
              {analyzingLog.map((log, i) => (
                <div key={i} className="text-green-400/80 animate-in slide-in-from-left duration-300 flex gap-3">
                  <span className="text-green-800 font-bold shrink-0">{`>`}</span>
                  <span>{log}</span>
                </div>
              ))}
              <div className="animate-pulse text-green-500 flex gap-3">
                 <span className="text-green-800 font-bold">{`>`}</span>
                 <span className="w-2 h-4 bg-green-500 block"></span>
              </div>
            </div>
          </div>
        )}

        {/* --- PHASE: SIMULATION --- */}
        {phase === 'SIMULATION' && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

            <div className="lg:col-span-3 space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-3 text-sm font-bold text-blue-400">
                <span className="bg-blue-950 px-3 py-1 rounded-full border border-blue-800 shadow-lg shadow-blue-900/20">SCENARIO {scenarioIndex + 1}/{currentScenarios.length}</span>
                <span className="text-slate-500 uppercase tracking-widest font-mono">{currentScenarios[scenarioIndex].year}</span>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white leading-tight">
                  <GlitchText text={currentScenarios[scenarioIndex].context} />
                </h2>
                <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl relative overflow-hidden shadow-xl">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                   <p className="text-xl text-slate-200 leading-relaxed">
                     <TypewriterText text={currentScenarios[scenarioIndex].incident} speed={25} />
                   </p>
                </div>
              </div>

              <div className="space-y-3">
                 <p className="text-xs text-blue-400 font-bold ml-1 uppercase tracking-widest">Voice Command Interface</p>
                 <div className={`relative bg-black/40 border-2 rounded-2xl p-6 transition-all duration-300 ${isListening ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-slate-700'}`}>
                    <textarea
                      className="w-full bg-transparent resize-none outline-none text-white placeholder-slate-600 text-lg h-24 font-medium"
                      placeholder="あなたの決断を、声で入力してください..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isListening ? <><MicOff size={18}/> Stop Recording</> : <><Mic size={18}/> Start Voice Input</>}
                      </button>

                      <div className="flex gap-4 items-center">
                        <button onClick={skip} className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors">SKIP DEMO</button>
                        <button
                          onClick={handleAnswer}
                          disabled={!transcript}
                          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-8 py-2.5 rounded-full font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                        >
                          Confirm Decision
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col items-center justify-center p-10 bg-slate-800/30 rounded-3xl border border-slate-700 relative backdrop-blur-sm">
               <h3 className="text-xs font-bold text-slate-400 tracking-widest mb-8 flex items-center gap-2">
                 <Activity size={16} className="text-blue-500"/> REALTIME METRICS
               </h3>
               <RadarChart data={metrics} size={350} />
               <div className="mt-8 text-center bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
                 <p className="text-xs text-slate-400 font-mono">
                   <span className="text-cyan-400">{userProfile.currentRole}</span> @ <span className="text-white font-bold">{companyName}</span> 2030
                 </p>
               </div>
            </div>

          </div>
        )}

        {/* --- PHASE: PROCESSING --- */}
        {phase === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center space-y-12">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
              <Server size={80} className="text-blue-400 relative z-10 animate-bounce" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-white animate-pulse">Generating Job Offer...</h2>
              <p className="text-slate-400 text-lg">
                <span className="text-cyan-400">{userProfile.currentRole}</span> × <span className="text-blue-400 font-bold">{companyName}</span>
              </p>
              <p className="text-slate-500">
                スキル「{userProfile.skills}」を2030年仕様に変換中...
              </p>
            </div>
          </div>
        )}

        {/* --- PHASE: FUTURE REVEAL --- */}
        {phase === 'FUTURE_REVEAL' && jobOffer && (
          <div className="w-full max-w-6xl pb-10">
            <JobOfferCard offer={jobOffer} userProfile={userProfile} />

            <div className="mt-16 text-center">
              <button
                onClick={resetAll}
                className="group text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto border border-slate-700 px-6 py-3 rounded-full hover:bg-slate-800 hover:border-slate-600"
              >
                <Search size={16} className="group-hover:text-blue-400 transition-colors" />
                Analyze Another Company
              </button>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
