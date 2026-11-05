'use client';

import ProjectGithubSection from '@/components/features/project/github/ProjectGithubSection';
import type { ProjectRecord } from '@/types/project';
import ProjectDetailTabs from './ProjectDetailTabs';
import ProjectIntroSection from './ProjectIntroSection';
import ProjectQnaSection from './ProjectQnaSection';
import ProjectRecruitSection from './ProjectRecruitSection';

export type ProjectDetailTab = 'intro' | 'recruit' | 'github' | 'qna';

type ProjectDetailContentProps = {
  project: ProjectRecord;
  activeTab: ProjectDetailTab;
  onTabChange: (tab: ProjectDetailTab) => void;
  canApply?: boolean;
  isParticipant?: boolean;
  canManageProject?: boolean;
  onCopyExternalUrl: (url: string, label: string) => void;
};

export default function ProjectDetailContent({
  project,
  activeTab,
  onTabChange,
  canApply = true,
  isParticipant = false,
  canManageProject = false,
  onCopyExternalUrl,
}: ProjectDetailContentProps) {
  return (
    <div className="min-w-0 space-y-6">
      <ProjectDetailTabs activeTab={activeTab} onTabChange={onTabChange} />

      {activeTab === 'intro' && (
        <ProjectIntroSection project={project} onCopyExternalUrl={onCopyExternalUrl} />
      )}
      {activeTab === 'recruit' && <ProjectRecruitSection project={project} canApply={canApply} />}
      {activeTab === 'github' && (
        <ProjectGithubSection
          projectId={project.id}
          projectTitle={project.title}
          canViewTeamProgress={isParticipant}
          canManageProject={canManageProject}
        />
      )}
      {activeTab === 'qna' && <ProjectQnaSection project={project} />}
    </div>
  );
}
