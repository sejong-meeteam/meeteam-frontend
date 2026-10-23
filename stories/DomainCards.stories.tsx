import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NotificationCard } from '@/components/features/notification/NotificationCard';
import { ProjectCard } from '@/components/features/project/ProjectCard';
import { TeammateCard } from '@/components/features/team/TeammateCard';

const meta = { id: 'domain-cards', title: '도메인/카드 상태', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const UnreadNotification: Story = {
  render: () => (
    <div className="max-w-3xl">
      <NotificationCard
        title="새로운 지원자가 있습니다."
        description="프로젝트 지원서를 확인해 주세요."
        timestamp="방금 전"
        variant="applicant"
        unread
        actionHref="/projects/101/manage/applicants"
        actionLabel="지원자 확인"
      />
    </div>
  ),
};
export const ReadNotification: Story = {
  render: () => (
    <div className="max-w-3xl">
      <NotificationCard
        title="프로젝트 합류가 승인되었습니다."
        description="리더와 함께 프로젝트를 시작하세요."
        timestamp="오늘"
        variant="welcome"
      />
    </div>
  ),
};
export const RejectedNotification: Story = {
  render: () => (
    <div className="max-w-3xl">
      <NotificationCard
        title="지원 결과 안내"
        description="다른 프로젝트에서 다시 도전해 보세요."
        timestamp="어제"
        variant="rejected"
      />
    </div>
  ),
};
const project = {
  id: 101,
  title: '함께 만드는 캠퍼스 서비스',
  imageUrl: '',
  category: '캡스톤',
  currentMembers: 2,
  maxMembers: 4,
  leader: { name: '김민지', avatar: '' },
  recruitInfo: [{ id: 1, role: '프론트엔드', status: 'open', current: 1, max: 3 }],
};
export const RecruitingProject: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ProjectCard project={project} />
    </div>
  ),
};
export const FullProject: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ProjectCard
        project={{
          ...project,
          title: '모집이 완료된 프로젝트',
          currentMembers: 4,
          recruitInfo: [{ id: 1, role: '프론트엔드', status: 'closed', current: 3, max: 3 }],
        }}
      />
    </div>
  ),
};
export const Teammate: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <TeammateCard
        teammate={{
          id: 1,
          name: '김민지',
          role: '프론트엔드',
          experienceCount: 2,
          skills: ['React', 'TypeScript'],
          imageUrl: '',
        }}
      />
    </div>
  ),
};
