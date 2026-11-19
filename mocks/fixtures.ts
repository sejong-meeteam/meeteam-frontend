// Mirrors the backend job seed plus contract C3 (MARKETING, DATA). Field order is the backend
// job_field id order (index + 1), which the member search filter sends as jobFieldId.
// Ids 1-9 predate the full seed and stay put because stored demo data references them.
const STACK = {
  React: { id: 1, name: 'React' },
  TypeScript: { id: 2, name: 'TypeScript' },
  NextJs: { id: 3, name: 'Next.js' },
  Flutter: { id: 4, name: 'Flutter' },
  Java: { id: 5, name: 'Java' },
  SpringBoot: { id: 6, name: 'Spring Boot' },
  MySQL: { id: 7, name: 'MySQL' },
  NodeJs: { id: 8, name: 'Node.js' },
  Figma: { id: 9, name: 'Figma' },
  Notion: { id: 10, name: 'Notion' },
  Jira: { id: 11, name: 'Jira' },
  GoogleAnalytics: { id: 12, name: 'Google Analytics' },
  Python: { id: 13, name: 'Python' },
  PyTorch: { id: 14, name: 'PyTorch' },
  LangChain: { id: 15, name: 'LangChain' },
  Docker: { id: 16, name: 'Docker' },
  AWS: { id: 17, name: 'AWS' },
  Kubernetes: { id: 18, name: 'Kubernetes' },
  GA4: { id: 19, name: 'GA4' },
  MetaAds: { id: 20, name: 'Meta Ads' },
  GoogleAds: { id: 21, name: 'Google Ads' },
  Canva: { id: 22, name: 'Canva' },
  R: { id: 23, name: 'R' },
  SQL: { id: 24, name: 'SQL' },
  Pandas: { id: 25, name: 'Pandas' },
  Tableau: { id: 26, name: 'Tableau' },
  Excel: { id: 27, name: 'Excel' },
  Photoshop: { id: 28, name: 'Photoshop' },
  Swift: { id: 29, name: 'Swift' },
  Kotlin: { id: 30, name: 'Kotlin' },
};

// One entry per stack, like the backend tech_stack table; fields share entries.
export const TECH_STACKS = Object.values(STACK);

export const JOB_OPTIONS = {
  fields: [
    {
      code: 'PLANNING',
      name: '기획',
      positions: [
        { id: 6, code: 'PRODUCT_MANAGER', name: 'PM 프로덕트 매니저' },
        { id: 7, code: 'PRODUCT_OWNER', name: 'PO 프로덕트 오너' },
        { id: 8, code: 'SERVICE_PLANNER', name: '서비스 기획' },
      ],
      techStacks: [STACK.Notion, STACK.Jira, STACK.Figma, STACK.GoogleAnalytics],
    },
    {
      code: 'DESIGN',
      name: '디자인',
      positions: [
        { id: 5, code: 'UI_UX_DESIGNER', name: 'UI/UX 디자이너' },
        { id: 9, code: 'MOTION_DESIGNER', name: '모션 디자이너' },
        { id: 10, code: 'BX_BRAND_DESIGNER', name: 'BX 브랜드 디자이너' },
      ],
      techStacks: [STACK.Figma, STACK.Photoshop],
    },
    {
      code: 'FRONTEND',
      name: '프론트',
      positions: [
        { id: 1, code: 'WEB_FRONTEND', name: '웹 프론트엔드' },
        { id: 11, code: 'IOS', name: 'iOS' },
        { id: 12, code: 'ANDROID', name: 'Android' },
        { id: 2, code: 'CROSS_PLATFORM', name: '크로스 플랫폼' },
      ],
      techStacks: [
        STACK.React,
        STACK.TypeScript,
        STACK.NextJs,
        STACK.Flutter,
        STACK.Swift,
        STACK.Kotlin,
      ],
    },
    {
      code: 'BACKEND',
      name: '백엔드',
      positions: [
        { id: 3, code: 'JAVA_SPRING', name: 'Java/Spring' },
        { id: 13, code: 'KOTLIN_SPRING', name: 'Kotlin/Spring' },
        { id: 4, code: 'NODE_NESTJS', name: 'Node.js/NestJS' },
        { id: 14, code: 'PYTHON_BACKEND', name: 'Python Backend' },
      ],
      techStacks: [STACK.Java, STACK.SpringBoot, STACK.MySQL, STACK.NodeJs, STACK.Python],
    },
    {
      code: 'AI',
      name: 'AI',
      positions: [
        { id: 15, code: 'MACHINE_LEARNING', name: '머신 러닝' },
        { id: 16, code: 'DEEP_LEARNING', name: '딥러닝' },
        { id: 17, code: 'LLM', name: 'LLM' },
        { id: 18, code: 'MLOPS', name: 'MLOps' },
      ],
      techStacks: [STACK.Python, STACK.Pandas, STACK.PyTorch, STACK.LangChain],
    },
    {
      code: 'INFRA_OPERATION',
      name: '인프라/운영',
      positions: [
        { id: 19, code: 'DEVOPS_ARCHITECT', name: 'DevOps 엔지니어/아키텍처' },
        { id: 20, code: 'QA', name: 'QA' },
        { id: 21, code: 'CLOUD_ENGINEER', name: 'Cloud 엔지니어' },
      ],
      techStacks: [STACK.AWS, STACK.Docker, STACK.Kubernetes, STACK.Jira],
    },
    {
      code: 'MARKETING',
      name: '마케팅',
      positions: [
        { id: 22, code: 'PERFORMANCE_MARKETER', name: '퍼포먼스 마케터' },
        { id: 23, code: 'CONTENT_MARKETER', name: '콘텐츠 마케터' },
        { id: 24, code: 'BRAND_MARKETER', name: '브랜드 마케터' },
      ],
      techStacks: [
        STACK.GA4,
        STACK.MetaAds,
        STACK.GoogleAds,
        STACK.Notion,
        STACK.Figma,
        STACK.Canva,
      ],
    },
    {
      code: 'DATA',
      name: '데이터',
      positions: [
        { id: 25, code: 'DATA_ANALYST', name: '데이터 분석가' },
        { id: 26, code: 'DATA_ENGINEER', name: '데이터 엔지니어' },
        { id: 27, code: 'DATA_SCIENTIST', name: '데이터 사이언티스트' },
      ],
      techStacks: [STACK.Python, STACK.R, STACK.SQL, STACK.Pandas, STACK.Tableau, STACK.Excel],
    },
  ],
};

export type MockMember = {
  memberId: number;
  name: string;
  namePrivate?: boolean;
  department?: string | null;
  schoolProfileVerified?: boolean;
  email: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  jobPositionIds: number[];
  techStackIds: number[];
  isParticipating: boolean;
  introduce: string;
  githubUrl: string;
  blogUrl: string;
  projectCount: number;
  profileImageUrl: string | null;
  studentId?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
  suspendedUntil?: string | null;
  suspendReason?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
};

export type MockProjectCard = {
  id: number;
  title: string;
  category: string;
  leader: string;
  currentMembers: number;
  maxMembers: number;
};

export const DEMO_PROJECTS: Record<number, MockProjectCard[]> = {
  1: [
    {
      id: 101,
      title: '캠퍼스 메이커스',
      category: '창의학기제',
      leader: '김민지',
      currentMembers: 4,
      maxMembers: 6,
    },
    {
      id: 102,
      title: '스터디 매칭 서비스',
      category: '동아리',
      leader: '김민지',
      currentMembers: 3,
      maxMembers: 5,
    },
  ],
  2: [
    {
      id: 103,
      title: 'API 챌린지',
      category: '캡스톤',
      leader: '이준호',
      currentMembers: 2,
      maxMembers: 4,
    },
  ],
};

const DEMO_MEMBER_SEEDS = [
  ['박서연', 'FEMALE', 1, [1, 3]],
  ['최도윤', 'MALE', 3, [5, 6]],
  ['정하은', 'FEMALE', 5, [9]],
  ['강지후', 'MALE', 2, [4]],
  ['조유나', 'FEMALE', 4, [8, 7]],
  ['윤시우', 'MALE', 6, [10, 11]],
  ['장서윤', 'FEMALE', 5, [9]],
  ['임준서', 'MALE', 3, [5, 7]],
  ['한지아', 'FEMALE', 23, [19, 22]],
  ['오현우', 'MALE', 4, [8]],
  ['서채원', 'FEMALE', 25, [24, 26]],
  ['신우진', 'MALE', 3, [6, 7]],
  ['권나연', 'FEMALE', 22, [19, 20, 21]],
  ['황건우', 'MALE', 1, [1]],
  ['안수아', 'FEMALE', 27, [13, 25]],
  ['송민재', 'MALE', 2, [4]],
  ['류다인', 'FEMALE', 8, [10, 9]],
  ['전태윤', 'MALE', 4, [8]],
  ['홍예린', 'FEMALE', 5, [9]],
  ['고은찬', 'MALE', 3, [5]],
  ['문소율', 'FEMALE', 1, [2]],
  ['양지환', 'MALE', 4, [8, 7]],
  ['손하린', 'FEMALE', 2, [4, 1]],
  ['배승현', 'MALE', 3, [6]],
] as const;

export const DEMO_SUSPENDED_MEMBER_ID = 205;
export const DEMO_WITHDRAWN_MEMBER_ID = 210;
export const DEMO_ADMIN_MEMBER_ID = 99;

function createDemoMembers(): MockMember[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return DEMO_MEMBER_SEEDS.map(([name, gender, positionId, techStackIds], index) => {
    const memberId = 201 + index;
    const status =
      memberId === DEMO_SUSPENDED_MEMBER_ID
        ? 'SUSPENDED'
        : memberId === DEMO_WITHDRAWN_MEMBER_ID
          ? 'WITHDRAWN'
          : 'ACTIVE';
    return {
      memberId,
      name,
      email: `member${memberId}@example.com`,
      birthDate: `${2000 + (index % 5)}-0${(index % 9) + 1}-1${index % 9}`,
      gender,
      jobPositionIds: [positionId],
      techStackIds: [...techStackIds],
      isParticipating: index % 3 !== 0,
      introduce: `${name}입니다. 함께 성장할 팀을 찾고 있어요.`,
      githubUrl: '',
      blogUrl: '',
      projectCount: 0,
      profileImageUrl: null,
      studentId: `2025${String(1001 + index).padStart(4, '0')}`,
      role: 'USER',
      status,
      suspendedUntil: status === 'SUSPENDED' ? new Date(now + 5 * day).toISOString() : null,
      suspendReason: status === 'SUSPENDED' ? '프로젝트 Q&A에 반복적인 홍보성 글 작성' : null,
      createdAt: new Date(now - index * 2 * day - (index % 4) * 3600000).toISOString(),
      lastLoginAt:
        status === 'WITHDRAWN' ? null : new Date(now - (index % 6) * day - 1800000).toISOString(),
    };
  });
}

export const INITIAL_MEMBERS: MockMember[] = [
  {
    memberId: 1,
    name: '김민지',
    email: 'minji@example.com',
    birthDate: '2002-05-14',
    gender: 'FEMALE',
    jobPositionIds: [1],
    techStackIds: [1, 2, 3],
    isParticipating: true,
    introduce:
      '사용자 경험을 고민하는 프론트엔드 개발자입니다. 함께 배우며 만드는 프로젝트를 좋아해요.',
    githubUrl: 'https://github.com/',
    blogUrl: '',
    projectCount: 2,
    profileImageUrl: null,
    studentId: '20260001',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-03-02T09:00:00.000Z',
    lastLoginAt: '2026-11-04T10:20:00.000Z',
  },
  {
    memberId: 2,
    name: '이준호',
    email: 'junho@example.com',
    birthDate: '2001-11-03',
    gender: 'MALE',
    jobPositionIds: [3],
    techStackIds: [5, 6, 7],
    isParticipating: false,
    introduce: '안정적인 API와 데이터 모델링에 관심이 있습니다.',
    githubUrl: '',
    blogUrl: '',
    projectCount: 1,
    profileImageUrl: null,
    studentId: '20250012',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-03-05T11:30:00.000Z',
    lastLoginAt: '2026-11-01T08:10:00.000Z',
  },
  {
    memberId: 99,
    name: '미팀 운영자',
    email: 'admin@meeteam.kr',
    birthDate: '1999-01-01',
    gender: 'MALE',
    jobPositionIds: [1],
    techStackIds: [1, 2],
    isParticipating: false,
    introduce: '미팀 서비스 운영 계정입니다.',
    githubUrl: '',
    blogUrl: '',
    projectCount: 0,
    profileImageUrl: null,
    studentId: '20260000',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-02-20T09:00:00.000Z',
    lastLoginAt: null,
  },
  ...createDemoMembers(),
];

const PROJECT_SEEDS = [
  ['캠퍼스 메이커스', 'CAPSTONE', 'WEB', 'FRONTEND', 1, 1],
  ['스터디 매칭 서비스', 'CLUB', 'WEB', 'BACKEND', 3, 5],
  ['API 챌린지', 'CONTEST', 'WEB', 'BACKEND', 4, 8],
  ['세종 맛집 지도', 'CREATIVE_SEMESTER', 'IOS', 'DESIGN', 5, 9],
  ['학교 일정 한눈에', 'ETC', 'ANDROID', 'FRONTEND', 2, 4],
  ['학습 기록 대시보드', 'CLUB', 'WEB', 'DATA', 25, 24],
  ['캠퍼스 중고 거래', 'CAPSTONE', 'WEB', 'BACKEND', 3, 6],
  ['동아리 행사 캘린더', 'CREATIVE_SEMESTER', 'IOS', 'DESIGN', 5, 9],
  ['AI 아이디어 노트', 'ETC', 'WEB', 'PLANNING', 8, 10],
  ['코딩 테스트 스터디', 'STUDY', 'WEB', 'BACKEND', 4, 8],
  ['교내 셔틀 도우미', 'CAPSTONE', 'ANDROID', 'FRONTEND', 2, 4],
  ['전시회 큐레이션', 'CREATIVE_SEMESTER', 'WEB', 'MARKETING', 23, 22],
] as const;

const SEED_COLLABORATION: Record<string, ProjectCollaboration> = {
  '캠퍼스 메이커스': {
    meetingMode: 'ONLINE',
    weeklyHours: 6,
    meetingNote: '화요일 저녁 9시 디스코드',
  },
  '스터디 매칭 서비스': {
    meetingMode: 'HYBRID',
    weeklyHours: 4,
    meetingNote: '격주 토요일 오후 학생회관, 평소엔 온라인',
  },
  'API 챌린지': {
    meetingMode: 'OFFLINE',
    weeklyHours: 10,
    meetingNote: '목요일 오후 6시 공학관 세미나실',
  },
  '학교 일정 한눈에': { meetingMode: 'OFFLINE', weeklyHours: 3, meetingNote: null },
  '코딩 테스트 스터디': {
    meetingMode: 'ONLINE',
    weeklyHours: 5,
    meetingNote: '월·목 밤 10시 구글 밋',
  },
};

export const INITIAL_PROJECTS: ProjectRecord[] = PROJECT_SEEDS.map(
  ([name, category, platform, field, positionId, skillId], index) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14 + index * 3);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - index);
    return {
      id: 101 + index,
      name,
      category,
      platform,
      description: `${name} 프로젝트에서 함께 문제를 해결할 팀원을 모집합니다. 관심 있는 분은 프로젝트에 참여해 주세요.`,
      githubUrl: '',
      communicationUrl: '',
      leaderPositionId: positionId,
      recruitments: [
        { jobFieldCode: field, jobPositionId: positionId, count: 3, techStackIds: [skillId] },
      ],
      deadline: deadline.toISOString().slice(0, 10),
      closeWhenFull: false,
      leaderId: index % 2 === 0 ? 1 : 2,
      leaderName: index % 2 === 0 ? '김민지' : '이준호',
      imageUrl: null,
      createdAt: createdAt.toISOString(),
      currentMembers: 1,
      ...SEED_COLLABORATION[name],
    };
  },
);
import type { ProjectCollaboration, ProjectRecord } from './projectContract';
