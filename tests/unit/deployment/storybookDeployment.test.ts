import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import storybookConfig from '../../../.storybook/main';
import { toRelativeRuntimePath } from '../../../.storybook/staticPaths';
import nextConfig from '../../../next.config';

describe('Storybook 동시 배포 설정', () => {
  it('생성한 산출물과 MSW 워커를 정적 자산 입력에 다시 포함하지 않는다', () => {
    expect(storybookConfig.staticDirs).toEqual([
      { from: '../public/brand', to: '/brand' },
      { from: '../public/universities', to: '/universities' },
    ]);
  });

  it('Vite의 public 자동 복사를 막고 번들을 상대 경로로 출력한다', async () => {
    const config = await storybookConfig.viteFinal!({}, {
      configType: 'PRODUCTION',
    } as Parameters<NonNullable<typeof storybookConfig.viteFinal>>[1]);
    expect(config).toMatchObject({ publicDir: false, base: './' });
  });

  it('진입 URL에 쿼리를 유지할 수 있는 index 리다이렉트만 추가한다', async () => {
    expect(await nextConfig.redirects!()).toEqual([
      { source: '/storybook', destination: '/storybook/index.html', permanent: false },
    ]);
  });

  it('Storybook 런타임만 상대 경로로 바꾸고 나머지 자산 URL은 보존한다', () => {
    expect(
      toRelativeRuntimePath(
        '<script src="/vite-inject-mocker-entry.js"></script><img src="/brand/logo.png">',
      ),
    ).toBe('<script src="./vite-inject-mocker-entry.js"></script><img src="/brand/logo.png">');
    expect(toRelativeRuntimePath('<script src="./assets/preview.js"></script>')).toBe(
      '<script src="./assets/preview.js"></script>',
    );
  });

  it('Vercel에서 Storybook을 먼저 생성하고 기존 Next 빌드를 실행한다', () => {
    const vercel = JSON.parse(
      readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'),
    );
    const { scripts } = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
    );
    expect(vercel.buildCommand).toBe('npm run build:vercel');
    expect(scripts['build:vercel']).toBe('npm run build-storybook:deploy && next build');
    expect(scripts['build-storybook:deploy']).toContain('--output-dir public/storybook');
    expect(scripts.build).toBe('next build');
  });
});
