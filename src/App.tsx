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
  Target,
  Download,
  Film,
  Loader2,
  ImageIcon,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
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

// 職種選択の質問（最初の質問）
const ROLE_QUESTION = {
  id: 'currentRole',
  icon: User,
  question: "現在の職種・役職を教えてください",
  placeholder: "例: バックエンドエンジニア、プロジェクトマネージャー",
  examples: ["エンジニア", "PM", "デザイナー", "営業", "マーケター", "コンサルタント"]
};

// 職種ごとのスキル質問設定
const ROLE_SPECIFIC_QUESTIONS: Record<string, {
  skills: { question: string; placeholder: string; examples: string[] };
  careerGoal: { question: string; placeholder: string; examples: string[] };
}> = {
  "エンジニア": {
    skills: {
      question: "得意な技術スタック・言語は何ですか？",
      placeholder: "例: Python, TypeScript, Go, Kubernetes",
      examples: ["Python", "TypeScript", "Go", "React", "Rust", "AWS"]
    },
    careerGoal: {
      question: "エンジニアとして2030年にどうなっていたい？",
      placeholder: "例: アーキテクトとして大規模システムを設計したい",
      examples: ["技術を極めたい", "CTOになりたい", "OSS開発に専念したい", "AI×インフラを極めたい"]
    }
  },
  "PM": {
    skills: {
      question: "PMとしての強み・得意領域は？",
      placeholder: "例: アジャイル開発、ステークホルダー調整",
      examples: ["アジャイル", "ロードマップ策定", "データ分析", "UXリサーチ", "技術理解"]
    },
    careerGoal: {
      question: "PMとして2030年にどうなっていたい？",
      placeholder: "例: CPOとしてプロダクト戦略を統括したい",
      examples: ["CPOになりたい", "新規事業立ち上げ", "グローバル展開", "AI プロダクト特化"]
    }
  },
  "デザイナー": {
    skills: {
      question: "デザインの得意分野・ツールは？",
      placeholder: "例: UI/UX、Figma、ブランディング",
      examples: ["UI/UX", "Figma", "グラフィック", "モーション", "プロトタイピング"]
    },
    careerGoal: {
      question: "デザイナーとして2030年にどうなっていたい？",
      placeholder: "例: デザインシステムを統括するリードデザイナー",
      examples: ["CDOになりたい", "デザインシステム構築", "AI×デザイン", "クリエイティブディレクター"]
    }
  },
  "営業": {
    skills: {
      question: "営業としての強み・経験領域は？",
      placeholder: "例: エンタープライズ営業、SaaS、新規開拓",
      examples: ["エンタープライズ", "新規開拓", "インサイドセールス", "カスタマーサクセス"]
    },
    careerGoal: {
      question: "営業として2030年にどうなっていたい？",
      placeholder: "例: CROとして営業組織を統括したい",
      examples: ["CROになりたい", "グローバル営業", "AI活用で効率化", "戦略立案側"]
    }
  },
  "マーケター": {
    skills: {
      question: "マーケティングの得意分野は？",
      placeholder: "例: グロースハック、SEO、データ分析",
      examples: ["グロースハック", "SEO", "SNS運用", "データ分析", "ブランディング"]
    },
    careerGoal: {
      question: "マーケターとして2030年にどうなっていたい？",
      placeholder: "例: CMOとして事業成長を牽引したい",
      examples: ["CMOになりたい", "グローバル展開", "AI×マーケ", "データドリブン経営"]
    }
  },
  "コンサルタント": {
    skills: {
      question: "コンサルティングの専門領域は？",
      placeholder: "例: 戦略、IT、組織変革、財務",
      examples: ["戦略", "IT", "組織変革", "DX", "M&A"]
    },
    careerGoal: {
      question: "コンサルタントとして2030年にどうなっていたい？",
      placeholder: "例: パートナーとして大型案件をリードしたい",
      examples: ["パートナー昇格", "独立起業", "事業会社CxO", "AI戦略特化"]
    }
  },
  // デフォルト（その他の職種）
  "default": {
    skills: {
      question: "得意なスキル・専門領域は何ですか？",
      placeholder: "例: データ分析、プロジェクトマネジメント、企画立案",
      examples: ["データ分析", "企画立案", "チームマネジメント", "業務改善"]
    },
    careerGoal: {
      question: "2030年、どんな働き方をしていたいですか？",
      placeholder: "例: AIと協働しながら新規事業を立ち上げたい",
      examples: ["専門性を極めたい", "経営に関わりたい", "起業したい", "社会課題解決"]
    }
  }
};

// 職種に応じた質問を取得する関数
const getQuestionsForRole = (role: string) => {
  // 職種名に含まれるキーワードでマッチング
  const roleLower = role.toLowerCase();

  let roleKey = "default";
  if (roleLower.includes("エンジニア") || roleLower.includes("engineer")) {
    roleKey = "エンジニア";
  } else if (roleLower.includes("pm") || roleLower.includes("プロダクト") || roleLower.includes("product")) {
    roleKey = "PM";
  } else if (roleLower.includes("デザイナー") || roleLower.includes("design")) {
    roleKey = "デザイナー";
  } else if (roleLower.includes("営業") || roleLower.includes("sales")) {
    roleKey = "営業";
  } else if (roleLower.includes("マーケ") || roleLower.includes("marketing")) {
    roleKey = "マーケター";
  } else if (roleLower.includes("コンサル") || roleLower.includes("consultant")) {
    roleKey = "コンサルタント";
  }

  return ROLE_SPECIFIC_QUESTIONS[roleKey];
};

// プロフィール質問の動的生成用配列（互換性のため）
const PROFILE_QUESTIONS = [
  ROLE_QUESTION,
  { id: 'skills', icon: Sparkles, question: '', placeholder: '', examples: [] },
  { id: 'careerGoal', icon: Target, question: '', placeholder: '', examples: [] }
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

// 全て動的にAI生成するため、プリセットは削除

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
      - 質問の最後は必ず「あなたは〇〇として、どう判断しますか？」の形式にする
        （〇〇には「プロジェクトリーダー」「マネージャー」「責任者」など具体的な役職を入れる）

      JSON形式で返してください:
      {
        "scenarios": [
          {
            "id": 1,
            "year": "Phase 1: 2026",
            "context": "短いタイトル（5-10文字）",
            "incident": "具体的な状況説明（100-150文字）。最後は必ず「あなたは〇〇として、どう判断しますか？」で終わる（〇〇には具体的な役職名を入れる）",
            "targetMetric": "humanCentric"
          },
          {
            "id": 2,
            "year": "Phase 2: 2028",
            "context": "短いタイトル",
            "incident": "具体的な状況説明。最後は必ず「あなたは〇〇として、どう判断しますか？」で終わる",
            "targetMetric": "bizIntegration"
          },
          {
            "id": 3,
            "year": "Phase 3: 2030",
            "context": "短いタイトル",
            "incident": "具体的な状況説明。最後は必ず「あなたは〇〇として、どう判断しますか？」で終わる",
            "targetMetric": "systemResilience"
          }
        ]
      }

      【重要な注意点】
      - 質問の最後は「〜としてどう判断しますか？」ではなく、
        「あなたは〇〇として、どう判断しますか？」と、必ず具体的な役職を入れてください
      - 良い例: 「あなたはプロジェクトリーダーとして、どう判断しますか？」
      - 悪い例: 「〜としてどう判断しますか？」（役職が抜けている）
      - 必ず「判断しますか？」で終わらせてください（「対応しますか？」は不要）

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

// 全て動的にAI生成するため、PRESET_OFFERSは削除

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
  const radius = (size / 2) - 50;
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
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Background glow */}
        <circle cx={center} cy={center} r={radius} fill="url(#radarGlow)" />

        {/* Grid circles with glow effect */}
        {[20, 40, 60, 80, 100].map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(r/100)*radius}
            fill="none"
            stroke={i === 4 ? "#0ea5e9" : "#1e3a5f"}
            strokeWidth={i === 4 ? "2" : "1"}
            strokeDasharray={i === 4 ? "none" : "2 4"}
            opacity={i === 4 ? "0.8" : "0.4"}
            filter={i === 4 ? "url(#glow)" : "none"}
          />
        ))}

        {/* Axis lines */}
        {keys.map((_, i) => {
          const x2 = center + radius * Math.cos(i * angleSlice - Math.PI / 2);
          const y2 = center + radius * Math.sin(i * angleSlice - Math.PI / 2);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#1e3a5f"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          );
        })}

        {/* Data polygon with gradient and glow */}
        <polygon
          points={points}
          fill="url(#gridGradient)"
          fillOpacity="0.4"
          stroke="#06b6d4"
          strokeWidth="2.5"
          filter="url(#glow)"
        />

        {/* Data points */}
        {keys.map((key, i) => {
          const value = data[key];
          const r = (value / 100) * radius;
          const x = center + r * Math.cos(i * angleSlice - Math.PI / 2);
          const y = center + r * Math.sin(i * angleSlice - Math.PI / 2);
          return (
            <g key={`point-${i}`}>
              <circle cx={x} cy={y} r="6" fill="#0ea5e9" opacity="0.5" filter="url(#glow)" />
              <circle cx={x} cy={y} r="3" fill="#06b6d4" />
            </g>
          );
        })}

        {/* Labels */}
        {keys.map((key, i) => {
          const lx = center + (radius + 35) * Math.cos(i * angleSlice - Math.PI / 2);
          const ly = center + (radius + 35) * Math.sin(i * angleSlice - Math.PI / 2);
          const label = key === 'aiDirection' ? 'AI DIRECTION' :
                        key === 'humanCentric' ? 'HUMANITY' :
                        key === 'systemResilience' ? 'RESILIENCE' : 'BIZ INTEGRATION';
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              fill="#0ea5e9"
              fontSize="10"
              fontWeight="700"
              className="uppercase tracking-wider"
              filter="url(#glow)"
            >
              {label}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r="4" fill="#06b6d4" opacity="0.6" filter="url(#glow)" />
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

  // MulmoCast Image Generation
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState(0);
  const [imageGenError, setImageGenError] = useState<string | null>(null);

  // MulmoCast Movie Generation
  const [generatedMovieUrl, setGeneratedMovieUrl] = useState<string | null>(null);
  const [isGeneratingMovie, setIsGeneratingMovie] = useState(false);
  const [movieGenProgress, setMovieGenProgress] = useState(0);
  const [movieGenError, setMovieGenError] = useState<string | null>(null);

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

    // 常にAI生成を使用（APIキーがある場合）
    const needsAIGeneration = !!apiKey;

    speak(`${userProfile.currentRole}として${companyName}で働く未来を解析中。あなたの${userProfile.skills}スキルが2030年にどう進化するか予測します。`);

    // パーソナライズされたログメッセージ
    const logs = [
      `[CONNECT] ${companyUrl} へニューラルネット経由で接続中...`,
      `[SCAN] ${companyName} の企業DNAをスキャン中...`,
      `[PROFILE] ${userProfile.currentRole} のキャリアパターンを解析中...`,
      `[SKILL] 「${userProfile.skills}」を2030年仕様にマッピング中...`,
      `[GOAL] 「${userProfile.careerGoal}」との整合性を計算中...`,
      `[AI] ${companyName} × ${userProfile.currentRole} の未来シナリオを生成中...`,
      `[AI] ${userProfile.skills} → 2030年スキルへの変換パスを構築中...`,
      `[PREDICT] ${companyName}の2030年組織図を予測中...`,
      `[GENERATE] ${userProfile.currentRole}専用のキャリアパスを生成中...`
    ];

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

        // シナリオを設定（AI生成 or デフォルト）
        let finalScenarios: Scenario[];
        if (scenariosPromise) {
          finalScenarios = await scenariosPromise;
        } else {
          finalScenarios = DEFAULT_SCENARIOS;
        }
        setCurrentScenarios(finalScenarios);

        setTimeout(() => {
          playSound('success');
          speak(`解析完了。${userProfile.currentRole}の${companyName}でのキャリア・シミュレーションを開始します。`);
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
    const answer = transcript.toLowerCase();

    // キーワードベースの詳細分析
    const aiKeywords = ['ai', 'automation', '自動', '機械学習', 'データ', 'アルゴリズム'];
    const humanKeywords = ['人', '倫理', 'プライバシー', '透明', '公平', 'チーム', 'コミュニケーション'];
    const systemKeywords = ['セキュリティ', '堅牢', 'テスト', '監視', 'リスク', '安定'];
    const bizKeywords = ['ビジネス', '収益', '顧客', '価値', '戦略', '成長', '効率'];

    const aiScore = aiKeywords.filter(k => answer.includes(k)).length * 8;
    const humanScore = humanKeywords.filter(k => answer.includes(k)).length * 8;
    const systemScore = systemKeywords.filter(k => answer.includes(k)).length * 8;
    const bizScore = bizKeywords.filter(k => answer.includes(k)).length * 8;

    // 長さボーナス（思考の深さ）
    const lengthBonus = Math.min(transcript.length / 5, 20);

    // ターゲットメトリックに主要なブースト
    const targetBoost = 25 + lengthBonus + Math.random() * 10;

    setMetrics(prev => ({
      aiDirection: Math.min(100, prev.aiDirection + (target === 'aiDirection' ? targetBoost : aiScore)),
      humanCentric: Math.min(100, prev.humanCentric + (target === 'humanCentric' ? targetBoost : humanScore)),
      systemResilience: Math.min(100, prev.systemResilience + (target === 'systemResilience' ? targetBoost : systemScore)),
      bizIntegration: Math.min(100, prev.bizIntegration + (target === 'bizIntegration' ? targetBoost : bizScore))
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
    // 入力値をサニタイズ
    const safeCompany = sanitizeInput(company);
    const safeRole = sanitizeInput(profile.currentRole);
    const safeSkills = sanitizeInput(profile.skills);
    const safeGoal = sanitizeInput(profile.careerGoal);
    const safeAnswers = answers.map(a => sanitizeInput(a));

    // APIキーがある場合はAIを使用
    if (apiKey) {
      try {
        // シナリオ回答のコンテキスト
        const scenarioContext = safeAnswers.length > 0 ? `
          【重要：この人物の意思決定パターン分析】
          以下の未来シナリオへの回答から、この人物の性格・価値観・強みを深く読み取ってください。

          ■ シナリオ1「${currentScenarios[0]?.context || '課題'}」
          回答: 「${safeAnswers[0] || '(スキップ)'}」
          → この回答から読み取れる特性は？

          ■ シナリオ2「${currentScenarios[1]?.context || '課題'}」
          回答: 「${safeAnswers[1] || '(スキップ)'}」
          → この回答から読み取れる特性は？

          ■ シナリオ3「${currentScenarios[2]?.context || '課題'}」
          回答: 「${safeAnswers[2] || '(スキップ)'}」
          → この回答から読み取れる特性は？

          上記の回答パターンを総合して、この人物に最適な2030年の役割を導き出してください。
        ` : '';

        const prompt = `
          あなたは2030年の${safeCompany}で働く、未来のタレントアクイジション・ディレクターです。
          今、過去（2024年）から優秀な人材をスカウトしようとしています。

          【スカウト対象者】
          - 現在の職種: ${safeRole}
          - 得意スキル: ${safeSkills}
          - 本人の夢: ${safeGoal}

          ${scenarioContext}

          【あなたのミッション】
          この人物の回答を深く分析し、${safeCompany}の2030年における「まだ存在しない革新的なポジション」をオファーしてください。

          【出力ルール - 超重要】

          1. title (職種名):
             - SF映画級のカッコいい英語タイトル必須
             - 良い例: "Cognitive Mesh Architect", "Synthetic Reality Commander", "Neural Governance Director"
             - 悪い例: "AI Engineer", "Data Scientist", "Project Manager" (既存職種はNG)

          2. department (部署名):
             - 2030年らしい未来的な部署名（日本語）
             - 良い例: "量子意思決定研究所", "人機共創デザインラボ", "自律システム倫理室"
             - 悪い例: "AI部", "開発部", "DX推進室" (ありきたりはNG)

          3. mission (ミッション):
             - 1-2文で、SF的かつ具体的に
             - 回答で見せた価値観を必ず反映
             - 良い例: "人間とAIエージェントの信頼関係を設計し、10万人規模の組織における意思決定遅延をゼロにする"
             - 悪い例: 箇条書きや長い説明文はNG

          4. skillTransfer (スキル進化):
             - from: ユーザーの実際のスキル「${safeSkills}」を使う
             - to: 2030年の超進化形（SF的に）
             - 3つ全て異なる切り口で

          5. dailyTask (日常業務):
             - 1文で、SF的だが具体的なイメージができる業務
             - 回答パターンを反映

          JSON形式で返してください:
          {
            "companyName": "${safeCompany}",
            "title": "SF的英語タイトル（3-5単語）",
            "department": "未来的な部署名（日本語）",
            "mission": "SF的かつ回答を反映した1-2文のミッション",
            "skillTransfer": [
              {"from": "${safeSkills}", "to": "2030年の超進化形スキル"},
              {"from": "${safeRole}経験", "to": "未来で必要とされる形"},
              {"from": "回答で見せた資質", "to": "それを武器にした未来スキル"}
            ],
            "dailyTask": "SF的だが具体的な1文の業務内容"
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
          console.warn("API Error, falling back to mock");
        }
      }
    }

    // APIがない場合のフォールバック（動的にユーザー入力を反映）
    return {
      companyName: company,
      title: "Cognitive Systems Orchestrator",
      department: "人機共創イノベーション研究所",
      mission: `${safeRole}としての経験と「${safeSkills}」のスキルを活かし、${company}のコア事業をAIエージェントと統合。「${safeGoal}」というあなたの夢を2030年に実現する。`,
      skillTransfer: [
        { from: safeSkills || "現在のスキル", to: "量子コンピューティング対応AI設計" },
        { from: `${safeRole}経験`, to: "自律システム統括ディレクション" },
        { from: "問題解決力", to: "人機共創プロトコル設計" }
      ],
      dailyTask: `${company}の業務フローをリアルタイムで解析し、${safeSkills}を活かしたAIエージェント群の最適配置を指揮する`
    };
  };

  const finishSimulation = async (answers: string[]) => {
    setPhase('PROCESSING');
    speak(`シミュレーション終了。${userProfile.currentRole}の${userProfile.skills}スキルを2030年仕様に変換し、${companyName}でのあなた専用ポジションを生成します。`);

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

  // MulmoScript JSONを生成する関数（レート制限対策: 2画像のみ）
  const generateMulmoScript = (offer: JobOffer, profile: UserProfile) => {
    const mulmoScript = {
      "$mulmocast": { "version": "1.0" },
      "canvasSize": { "width": 1920, "height": 1080 },
      "htmlImageParams": { "provider": "anthropic" },
      "title": `${offer.companyName} - Career Transform 2030`,
      "description": `${profile.currentRole}から${offer.title}への未来キャリアパス`,
      "lang": "ja",
      "beats": [
        {
          "text": `2030年、${offer.companyName}があなたをスカウトしました。`,
          "htmlPrompt": {
            "prompt": `Create a futuristic corporate recruitment poster for ${offer.companyName} in 2030.
              Style: Cyberpunk meets corporate elegance, neon accents on dark background.
              Include: Company logo silhouette, holographic job title "${offer.title}",
              floating data particles, neural network patterns.
              Text overlay: "INTERNAL RECRUITMENT 2030"
              Color scheme: Deep blue, cyan accents, white text.
              Aspect ratio: 16:9, high quality, cinematic.`
          }
        },
        {
          "text": `ポジション: ${offer.title}。${offer.department}部門での活躍を期待しています。`,
          "htmlPrompt": {
            "prompt": `Create a futuristic job title card visualization.
              Main title: "${offer.title}" in large, glowing holographic text.
              Department: "${offer.department}" in smaller text below.
              Style: Sci-fi corporate, floating 3D text with particle effects.
              Background: Dark gradient with subtle grid pattern, blue/cyan glow.
              Include: Small AI assistant avatars, data streams, futuristic UI elements.
              Aspect ratio: 16:9.`
          }
        },
        {
          "text": `あなたのミッション: ${offer.mission}`,
          "htmlPrompt": {
            "prompt": `Create a mission statement visualization for a 2030 tech company.
              Mission: "${offer.mission}"
              Style: Epic, inspirational, sci-fi corporate presentation.
              Include: Abstract representations of the mission, glowing pathways,
              interconnected nodes representing collaboration, holographic displays.
              Color scheme: Blue gradient background, white and cyan accents.
              Aspect ratio: 16:9.`
          }
        },
        {
          "text": `あなたのスキル「${profile.skills}」は、${offer.skillTransfer[0]?.to || '次世代のテクノロジー'}へと進化します。`,
          "htmlPrompt": {
            "prompt": `Create a skill transformation visualization showing evolution from 2024 to 2030.
              From: "${profile.skills}" (shown as traditional icons/symbols)
              To: "${offer.skillTransfer[0]?.to || '次世代のテクノロジー'}" (shown as futuristic, glowing versions)
              Style: Split screen or morphing animation freeze-frame.
              Include: Transformation particles, upgrade indicators, progress bars at 100%.
              Arrow or flow showing the transformation direction.
              Color scheme: Left side warmer colors, right side cool blues/cyans.
              Aspect ratio: 16:9.`
          }
        },
        {
          "text": `日々の業務: ${offer.dailyTask}`,
          "htmlPrompt": {
            "prompt": `Create a futuristic workspace visualization for 2030.
              Daily task: "${offer.dailyTask}"
              Style: Sci-fi office environment, holographic displays everywhere.
              Include: Person working with AI assistants, floating data visualizations,
              neural interface headset optional, multiple holographic screens.
              Environment: Clean, high-tech, lots of blue ambient lighting.
              Aspect ratio: 16:9, cinematic quality.`
          }
        },
        {
          "text": `${offer.companyName}の未来は、あなたと共に。Career Transform 2030。`,
          "htmlPrompt": {
            "prompt": `Create an inspiring closing shot for a futuristic recruitment video.
              Company: ${offer.companyName}
              Tagline: "Career Transform 2030"
              Style: Epic, hopeful, sunrise over futuristic cityscape.
              Include: Company building silhouette, person looking towards future,
              "Welcome to 2030" message, subtle career path visualization.
              Color scheme: Dawn colors (orange/pink) transitioning to bright future (white/gold).
              Aspect ratio: 16:9, cinematic, inspirational.`
          }
        }
      ]
    };
    return mulmoScript;
  };

  // MulmoCast APIで画像を生成する関数
  const generateImagesFromMulmoScript = async () => {
    if (!jobOffer) return;

    setIsGeneratingImages(true);
    setImageGenProgress(0);
    setImageGenError(null);
    setGeneratedImages([]);
    playSound('click');

    if (soundEnabled) {
      speak('MulmoCastで未来のビジュアルを生成中...');
    }

    try {
      const mulmoScript = generateMulmoScript(jobOffer, userProfile);

      // Progress simulation while waiting for API
      const progressInterval = setInterval(() => {
        setImageGenProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch('http://localhost:3002/api/generate/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mulmoScript })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Image generation failed');
      }

      const result = await response.json();
      setImageGenProgress(100);

      if (result.images && result.images.length > 0) {
        // Add server base URL to image paths
        const fullImageUrls = result.images.map((img: string) => `http://localhost:3002${img}`);
        setGeneratedImages(fullImageUrls);
        playSound('success');
        if (soundEnabled) {
          speak(`${result.images.length}枚の画像を生成しました。`);
        }
      } else {
        setImageGenError('No images were generated');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setImageGenError(message);
      if (import.meta.env.DEV) {
        console.error('Image generation error:', error);
      }
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // MulmoCast APIで動画を生成する関数
  const generateMovieFromMulmoScript = async () => {
    if (!jobOffer) return;

    setIsGeneratingMovie(true);
    setMovieGenProgress(0);
    setMovieGenError(null);
    setGeneratedMovieUrl(null);
    playSound('click');

    if (soundEnabled) {
      speak('MulmoCastで未来のムービーを生成中...');
    }

    try {
      const mulmoScript = generateMulmoScript(jobOffer, userProfile);

      // Progress simulation while waiting for API
      const progressInterval = setInterval(() => {
        setMovieGenProgress(prev => Math.min(prev + 3, 85));
      }, 1000);

      const response = await fetch('http://localhost:3002/api/generate/movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mulmoScript })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Movie generation failed');
      }

      const result = await response.json();
      setMovieGenProgress(100);

      if (result.movieUrl) {
        setGeneratedMovieUrl(`http://localhost:3002${result.movieUrl}`);
        playSound('success');
        if (soundEnabled) {
          speak('ムービーの生成が完了しました。');
        }
      } else {
        setMovieGenError('No movie was generated');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMovieGenError(message);
      if (import.meta.env.DEV) {
        console.error('Movie generation error:', error);
      }
    } finally {
      setIsGeneratingMovie(false);
    }
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
                // 動的に質問を取得
                let q: { id: string; icon: React.ComponentType<any>; question: string; placeholder: string; examples: string[] };

                if (profileQuestionIndex === 0) {
                  // 最初の質問: 職種選択
                  q = ROLE_QUESTION;
                } else {
                  // 職種に応じた質問を取得
                  const roleQuestions = getQuestionsForRole(userProfile.currentRole);
                  if (profileQuestionIndex === 1) {
                    q = {
                      id: 'skills',
                      icon: Sparkles,
                      ...roleQuestions.skills
                    };
                  } else {
                    q = {
                      id: 'careerGoal',
                      icon: Target,
                      ...roleQuestions.careerGoal
                    };
                  }
                }

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
                      {profileQuestionIndex < 2 ? '次へ' : '解析開始'}
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
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
              <h2 className="text-3xl font-black text-white animate-pulse">
                {userProfile.currentRole} × {companyName}
              </h2>
              <p className="text-slate-400 text-lg">
                2030年のポジションを生成中...
              </p>
              <div className="space-y-2 text-slate-500 text-sm">
                <p className="animate-pulse">
                  「{userProfile.skills}」→ 2030年スキルに変換中...
                </p>
                <p className="animate-pulse delay-75">
                  「{userProfile.careerGoal}」に最適な役職を探索中...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- PHASE: FUTURE REVEAL --- */}
        {phase === 'FUTURE_REVEAL' && jobOffer && (
          <div className="w-full max-w-6xl pb-10">
            <JobOfferCard offer={jobOffer} userProfile={userProfile} />

            {/* Action Buttons */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Generate Images Button */}
              <button
                onClick={generateImagesFromMulmoScript}
                disabled={isGeneratingImages}
                className="group bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    生成中... {imageGenProgress}%
                  </>
                ) : (
                  <>
                    <ImageIcon size={20} className="group-hover:animate-pulse" />
                    未来のビジュアルを生成
                    <Play size={18} />
                  </>
                )}
              </button>

              {/* Generate Movie Button */}
              <button
                onClick={generateMovieFromMulmoScript}
                disabled={isGeneratingMovie}
                className="group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-purple-500/30 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingMovie ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    生成中... {movieGenProgress}%
                  </>
                ) : (
                  <>
                    <Film size={20} className="group-hover:animate-pulse" />
                    未来のムービーを生成
                    <Play size={18} />
                  </>
                )}
              </button>

              <button
                onClick={resetAll}
                className="group text-slate-500 hover:text-white transition-colors flex items-center gap-2 border border-slate-700 px-6 py-3 rounded-full hover:bg-slate-800 hover:border-slate-600"
              >
                <Search size={16} className="group-hover:text-blue-400 transition-colors" />
                Analyze Another Company
              </button>
            </div>

            {/* Image Generation Progress */}
            {isGeneratingImages && (
              <div className="mt-8 max-w-md mx-auto">
                <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${imageGenProgress}%` }}
                  />
                </div>
                <p className="text-center text-slate-400 text-sm mt-2">
                  MulmoCast で未来のビジュアルを生成中...
                </p>
              </div>
            )}

            {/* Movie Generation Progress */}
            {isGeneratingMovie && (
              <div className="mt-8 max-w-md mx-auto">
                <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-300"
                    style={{ width: `${movieGenProgress}%` }}
                  />
                </div>
                <p className="text-center text-slate-400 text-sm mt-2">
                  MulmoCast で未来のムービーを生成中...（これには数分かかる場合があります）
                </p>
              </div>
            )}

            {/* Image Generation Error */}
            {imageGenError && (
              <div className="mt-8 max-w-2xl mx-auto bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-center gap-3">
                <X size={20} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-red-300 font-medium">画像生成エラー</p>
                  <p className="text-red-400/80 text-sm">{imageGenError}</p>
                  <p className="text-red-400/60 text-xs mt-1">
                    ヒント: .env.localに ANTHROPIC_API_KEY を設定してください
                  </p>
                </div>
              </div>
            )}

            {/* Movie Generation Error */}
            {movieGenError && (
              <div className="mt-8 max-w-2xl mx-auto bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-center gap-3">
                <X size={20} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-red-300 font-medium">ムービー生成エラー</p>
                  <p className="text-red-400/80 text-sm">{movieGenError}</p>
                  <p className="text-red-400/60 text-xs mt-1">
                    ヒント: .env.localに ANTHROPIC_API_KEY を設定してください
                  </p>
                </div>
              </div>
            )}

            {/* Generated Movie Player */}
            {generatedMovieUrl && (
              <div className="mt-12">
                <h3 className="text-center text-xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                  <Film size={24} className="text-purple-400" />
                  生成されたムービー
                </h3>
                <div className="max-w-4xl mx-auto">
                  <div className="relative rounded-xl overflow-hidden border border-purple-700 shadow-2xl shadow-purple-500/20">
                    <video
                      src={generatedMovieUrl}
                      controls
                      className="w-full aspect-video"
                      autoPlay
                    >
                      お使いのブラウザは動画タグに対応していません。
                    </video>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <a
                      href={generatedMovieUrl}
                      download
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-medium transition-colors"
                    >
                      <Download size={18} />
                      ムービーをダウンロード
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Images Gallery */}
            {generatedImages.length > 0 && (
              <div className="mt-12">
                <h3 className="text-center text-xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                  <ImageIcon size={24} className="text-emerald-400" />
                  生成されたビジュアル
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                      <img
                        src={img}
                        alt={`Generated scene ${idx + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white text-sm font-medium">
                            Scene {idx + 1} / {generatedImages.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                💡 MulmoScriptは <a href="https://github.com/snakajima/mulmocast-cli" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">mulmocast-cli</a> で動画・画像に変換できます
              </p>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
