export const COMMUNITY = {
  name: 'JhatPat AI Club',
  tagline: 'Learn in public, build faster, and help each other win with AI.',
  stats: {
    members: 1248,
    groups: 6,
    postsThisWeek: 184,
    solvedQuestions: 92,
  },
  weeklyChallenge: {
    title: '7-Day Automation Sprint',
    description: 'Share one automation, workflow, or AI shortcut you used this week and help one other member improve theirs.',
    prize: 'Top 3 contributors get a featured spotlight on the club page.',
  },
};

export const COMMUNITY_GROUPS = [
  {
    slug: 'ai-builders',
    name: 'AI Builders',
    description: 'For members shipping prompts, workflows, copilots, and internal tools.',
    members: 382,
    momentum: '+18 this week',
    accent: '#0062ff',
  },
  {
    slug: 'content-lab',
    name: 'Content Lab',
    description: 'Prompt frameworks, content systems, social posts, landing pages, and creative ops.',
    members: 291,
    momentum: '+12 this week',
    accent: '#ff6b35',
  },
  {
    slug: 'automation-club',
    name: 'Automation Club',
    description: 'Zapier, Apps Script, scraping, reporting, and business automation workflows.',
    members: 344,
    momentum: '+21 this week',
    accent: '#10b981',
  },
  {
    slug: 'career-growth',
    name: 'Career Growth',
    description: 'Portfolio reviews, job-ready projects, AI freelancing, and accountability.',
    members: 231,
    momentum: '+9 this week',
    accent: '#7c3aed',
  },
];

export const COMMUNITY_MEMBERS = [
  {
    slug: 'ananya-mehta',
    name: 'Ananya Mehta',
    role: 'AI Workflow Strategist',
    company: 'Freelance',
    location: 'Mumbai',
    avatar: 'AM',
    badge: 'Top Helper',
    bio: 'Turns messy business processes into clear AI-powered workflows for creators and founders.',
    interests: ['Automation', 'Prompt Design', 'Google Workspace'],
    groupSlugs: ['automation-club', 'ai-builders'],
    stats: { posts: 28, comments: 114, reactions: 392, helpfulAnswers: 37 },
    activity: [
      'Answered 6 workflow questions this week',
      'Shared a Google Sheets + Apps Script starter template',
      'Hosted a prompt teardown in AI Builders',
    ],
  },
  {
    slug: 'rohan-iyer',
    name: 'Rohan Iyer',
    role: 'Content Systems Lead',
    company: 'BizSkill',
    location: 'Bengaluru',
    avatar: 'RI',
    badge: 'Club Mentor',
    bio: 'Helps teams build repeatable content engines using AI research, repurposing, and editorial workflows.',
    interests: ['Content Repurposing', 'SEO', 'Audience Growth'],
    groupSlugs: ['content-lab', 'career-growth'],
    stats: { posts: 21, comments: 88, reactions: 347, helpfulAnswers: 24 },
    activity: [
      'Published a carousel prompt stack',
      'Reviewed 4 member landing pages',
      'Started a discussion on audience research prompts',
    ],
  },
  {
    slug: 'simran-kohli',
    name: 'Simran Kohli',
    role: 'AI Product Learner',
    company: 'Student',
    location: 'Delhi',
    avatar: 'SK',
    badge: 'Rising Star',
    bio: 'Documenting the journey from learner to AI implementer with small experiments every week.',
    interests: ['Learning in Public', 'Notion', 'Prompt Experiments'],
    groupSlugs: ['career-growth', 'ai-builders'],
    stats: { posts: 14, comments: 61, reactions: 201, helpfulAnswers: 12 },
    activity: [
      'Shared a weekly progress post',
      'Asked a question about portfolio projects',
      'Joined the 7-Day Automation Sprint',
    ],
  },
  {
    slug: 'vikram-saini',
    name: 'Vikram Saini',
    role: 'Operations Manager',
    company: 'RetailOps',
    location: 'Jaipur',
    avatar: 'VS',
    badge: 'Consistency Streak',
    bio: 'Applies AI to operations, reporting, SOPs, and team enablement.',
    interests: ['Operations', 'Dashboards', 'SOP Automation'],
    groupSlugs: ['automation-club'],
    stats: { posts: 18, comments: 53, reactions: 167, helpfulAnswers: 19 },
    activity: [
      'Posted a stock reporting workflow',
      'Commented on 3 automation threads',
      'Earned a 5-week participation streak',
    ],
  },
];

export const COMMUNITY_POSTS = [
  {
    id: 'post-1',
    groupSlug: 'automation-club',
    authorSlug: 'ananya-mehta',
    type: 'question',
    time: '2h ago',
    title: 'What is the cleanest way to turn Google Form responses into personalized AI summaries?',
    body: 'I am testing a workflow where each response should trigger a concise summary, action list, and follow-up email draft. Curious whether people here would start with Apps Script, Make, or a server endpoint.',
    tags: ['Apps Script', 'Forms', 'Automation'],
    reactions: { like: 18, celebrate: 7, insightful: 14 },
    comments: [
      { authorSlug: 'vikram-saini', time: '1h ago', text: 'If the data shape is stable, Apps Script is the fastest first version. Add a queue only once volume grows.' },
      { authorSlug: 'rohan-iyer', time: '48m ago', text: 'I would also store the original prompt and output for QA. That helps when members start sharing templates.' },
    ],
  },
  {
    id: 'post-2',
    groupSlug: 'content-lab',
    authorSlug: 'rohan-iyer',
    type: 'update',
    time: '5h ago',
    title: 'New content repurposing framework for short-form AI education',
    body: 'Tested a simple workflow: lesson transcript to hook bank, then hook bank to carousel, reel script, and email intro. It cut our draft time by almost half. Happy to post the prompt stack if helpful.',
    tags: ['Content', 'Repurposing', 'Prompts'],
    reactions: { like: 24, celebrate: 12, insightful: 19 },
    comments: [
      { authorSlug: 'simran-kohli', time: '3h ago', text: 'Please share it. I am trying to turn course notes into LinkedIn posts without sounding robotic.' },
    ],
  },
  {
    id: 'post-3',
    groupSlug: 'career-growth',
    authorSlug: 'simran-kohli',
    type: 'discussion',
    time: '8h ago',
    title: 'What should go into an AI portfolio if you do not have client work yet?',
    body: 'I can show my prompts and mini automations, but I want the portfolio to feel outcome-driven. How are others presenting proof of skill while still learning?',
    tags: ['Portfolio', 'Career', 'Beginners'],
    reactions: { like: 16, celebrate: 10, insightful: 22 },
    comments: [
      { authorSlug: 'ananya-mehta', time: '6h ago', text: 'Use before-and-after case studies, even for self-initiated projects. Show time saved, error reduced, or quality improved.' },
    ],
  },
  {
    id: 'post-4',
    groupSlug: 'ai-builders',
    authorSlug: 'ananya-mehta',
    type: 'activity',
    time: '1d ago',
    title: 'Prompt teardown session notes: reducing hallucinations in workflow copilots',
    body: 'We tested tighter input schemas, explicit fallbacks, and confidence-based response sections. The biggest improvement came from structuring the output before asking for creativity.',
    tags: ['Builders', 'Prompting', 'Reliability'],
    reactions: { like: 31, celebrate: 8, insightful: 27 },
    comments: [
      { authorSlug: 'rohan-iyer', time: '18h ago', text: 'That output scaffolding tip is gold. It makes reviews much easier too.' },
      { authorSlug: 'vikram-saini', time: '17h ago', text: 'Would love an example for internal SOP copilots if you have one.' },
    ],
  },
  {
    id: 'post-5',
    groupSlug: 'automation-club',
    authorSlug: 'vikram-saini',
    type: 'update',
    time: '1d ago',
    title: 'Built an inventory digest that managers actually read',
    body: 'Instead of sending raw spreadsheets, I now send a daily AI summary with stock risks, slow movers, and urgent action items. Adoption jumped because the message is finally readable.',
    tags: ['Operations', 'Reporting', 'Dashboards'],
    reactions: { like: 20, celebrate: 15, insightful: 11 },
    comments: [
      { authorSlug: 'simran-kohli', time: '21h ago', text: 'This is such a good example of AI making existing work more useful, not just more complicated.' },
    ],
  },
];

export function getMemberBySlug(slug) {
  return COMMUNITY_MEMBERS.find((member) => member.slug === slug);
}

export function getGroupBySlug(slug) {
  return COMMUNITY_GROUPS.find((group) => group.slug === slug);
}

export function getPostsForGroup(groupSlug) {
  if (!groupSlug || groupSlug === 'all') return COMMUNITY_POSTS;
  return COMMUNITY_POSTS.filter((post) => post.groupSlug === groupSlug);
}

export function getTopContributors() {
  return [...COMMUNITY_MEMBERS].sort((a, b) => {
    const scoreA = a.stats.posts * 3 + a.stats.comments * 2 + a.stats.helpfulAnswers * 4;
    const scoreB = b.stats.posts * 3 + b.stats.comments * 2 + b.stats.helpfulAnswers * 4;
    return scoreB - scoreA;
  });
}
