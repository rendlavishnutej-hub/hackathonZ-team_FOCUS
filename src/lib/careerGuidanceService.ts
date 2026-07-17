/**
 * Career Guidance Service (Mock)
 *
 * TODO: Replace this mock with a real backend call once the team exposes
 *       a career-guidance endpoint (e.g. POST /api/career-guidance).
 *       The function signature is designed to be a drop-in swap:
 *       just replace the body of `getCareerSuggestions` with a fetch().
 */

export interface CareerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CourseContext {
  id: string;
  title: string;
}

// ─── Simulated latency (ms) ────────────────────────────────────────────────
const MOCK_DELAY_MS = 1200;

// ─── Keyword → response mapping for realistic demo ─────────────────────────
const MOCK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['math', 'maths', 'mathematics', 'calculus', 'statistics'],
    response: `Great question! Strong maths skills open doors to many rewarding careers:\n\n📊 **Data Scientist / Analyst** — Use statistical models and machine learning to extract insights from data. Median salary ~$120k.\n\n💰 **Quantitative Analyst** — Apply advanced maths to financial markets. Highly sought after by hedge funds and banks.\n\n🔬 **Actuary** — Assess risk for insurance and finance companies using probability and statistics.\n\n🏗️ **Engineer (various)** — Civil, mechanical, and aerospace engineering all rely heavily on applied mathematics.\n\n🎮 **Game Developer** — Linear algebra, physics simulations, and procedural generation all need strong maths foundations.\n\n💡 **Tip:** Consider pairing maths with a domain you enjoy (e.g. biology → bioinformatics, art → computational design) to stand out.`,
  },
  {
    keywords: ['art', 'design', 'creative', 'drawing', 'illustration'],
    response: `Creative skills are incredibly valuable in today's economy! Here are some paths:\n\n🎨 **UX/UI Designer** — Design intuitive digital experiences. One of the fastest-growing tech roles, with salaries ranging $80k–$140k.\n\n🖥️ **Motion Graphics Designer** — Create animations for ads, films, and apps. Tools like After Effects and Blender are key.\n\n🏛️ **Architect** — Blend artistic vision with structural engineering. Requires further study but deeply rewarding.\n\n📱 **Product Designer** — Shape how millions interact with apps and services. Combines user research with visual design.\n\n🎬 **Art Director** — Lead the visual identity of brands, campaigns, or publications.\n\n💡 **Tip:** Build a portfolio showcasing 3-5 strong projects rather than many mediocre ones. Quality over quantity wins every time.`,
  },
  {
    keywords: ['programming', 'coding', 'software', 'computer', 'developer', 'code', 'python', 'javascript', 'react', 'typescript'],
    response: `Software development is one of the most versatile career paths available:\n\n👨‍💻 **Full-Stack Developer** — Build complete web applications from frontend to backend. Huge demand across every industry.\n\n☁️ **Cloud / DevOps Engineer** — Design and manage scalable infrastructure. AWS, GCP, and Azure skills are highly valued.\n\n🤖 **Machine Learning Engineer** — Build AI systems that learn from data. Requires a blend of coding + maths.\n\n🔒 **Cybersecurity Engineer** — Protect systems from threats. A field with near-zero unemployment.\n\n📱 **Mobile Developer** — Create iOS/Android apps using Swift, Kotlin, or cross-platform frameworks like React Native.\n\n💡 **Tip:** Contributing to open-source projects is one of the fastest ways to build credibility and learn real-world patterns.`,
  },
  {
    keywords: ['science', 'biology', 'chemistry', 'physics', 'research'],
    response: `A passion for science can lead to impactful careers:\n\n🧬 **Biotech Researcher** — Work on gene therapies, drug development, or agricultural innovation.\n\n⚗️ **Chemical Engineer** — Design processes for manufacturing, energy, and environmental cleanup.\n\n🔭 **Research Scientist** — Push the boundaries of human knowledge in academia or R&D labs.\n\n🩺 **Medical Professional** — Medicine, dentistry, pharmacy — all rooted in strong science foundations.\n\n🌍 **Environmental Scientist** — Tackle climate change, conservation, and sustainability challenges.\n\n💡 **Tip:** Internships and lab experience during studies are invaluable — start reaching out to research groups early.`,
  },
  {
    keywords: ['business', 'management', 'entrepreneur', 'startup', 'marketing'],
    response: `Business-minded individuals have many exciting paths:\n\n🚀 **Startup Founder** — Build your own company. High risk, but potentially transformative.\n\n📈 **Management Consultant** — Advise organisations on strategy and operations. Top firms include McKinsey, BCG, and Bain.\n\n📊 **Product Manager** — Bridge business, design, and engineering to ship products users love.\n\n💼 **Investment Banking / VC** — Guide mergers, IPOs, or fund the next generation of startups.\n\n📣 **Digital Marketing Strategist** — Drive growth through data-driven campaigns across social, search, and content.\n\n💡 **Tip:** Real-world projects (even small ones) matter more than credentials alone. Start a side project or volunteer to lead one.`,
  },
  {
    keywords: ['writing', 'english', 'language', 'communication', 'journalism'],
    response: `Strong communication skills are a superpower in any field:\n\n✍️ **Content Strategist** — Shape brand voice and content across channels. High demand in tech and media.\n\n📰 **Journalist / Editor** — Investigate stories, inform the public, and hold power to account.\n\n📝 **Technical Writer** — Translate complex topics into clear documentation. Well-paid and in steady demand.\n\n🎙️ **Communications Director** — Lead PR and internal comms for organisations.\n\n📚 **Copywriter** — Craft compelling copy for ads, websites, and campaigns.\n\n💡 **Tip:** Start a blog or contribute articles to build a public writing portfolio — it's your best calling card.`,
  },
];

const DEFAULT_RESPONSE = `That's a thoughtful question! Here's some general career guidance:\n\n🧭 **Explore broadly, then specialise** — Try internships, online courses, and side projects in areas that interest you before committing.\n\n🤝 **Build a network** — Attend meetups, join online communities, and connect with professionals in fields you're curious about.\n\n📖 **Never stop learning** — The most successful professionals are lifelong learners. Platforms like Coursera, edX, and YouTube are treasure troves.\n\n🎯 **Align skills with passion** — The sweet spot is where what you're good at meets what you enjoy and what the world needs.\n\n💡 **Tip:** Would you like to ask about a specific subject or skill? I can give you more tailored suggestions! Try asking about maths, science, programming, art, business, or writing.`;

/**
 * Returns a career-guidance response for the given user message.
 *
 * @param message  The user's chat message
 * @param courses  Optional array of courses the student is studying (from localStorage)
 * @returns        A CareerMessage from the "assistant"
 *
 * TODO: Swap this implementation with:
 *   const res = await fetch('/api/career-guidance', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ message, courses }),
 *   });
 *   const data = await res.json();
 *   return { id: crypto.randomUUID(), role: 'assistant', content: data.reply, timestamp: Date.now() };
 */
export async function getCareerSuggestions(
  message: string,
  courses: CourseContext[] = [],
): Promise<CareerMessage> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const lowerMsg = message.toLowerCase();

  // Check for keyword matches
  let reply: string | null = null;
  for (const entry of MOCK_RESPONSES) {
    if (entry.keywords.some((kw) => lowerMsg.includes(kw))) {
      reply = entry.response;
      break;
    }
  }

  // If no keyword matched, use the default response
  if (!reply) {
    reply = DEFAULT_RESPONSE;
  }

  // Append course context if the student has courses
  if (courses.length > 0) {
    const courseList = courses.map((c) => c.title).join(', ');
    reply += `\n\n---\n📚 *Based on your current studies (${courseList}), I've tailored this advice to complement your learning path.*`;
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: reply,
    timestamp: Date.now(),
  };
}
