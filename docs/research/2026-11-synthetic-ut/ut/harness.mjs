#!/usr/bin/env node
// meeTeam 합성 페르소나 UT 하네스.
// 사용법: node harness.mjs --label <baseline|after> --out <dir> [--only T1,T3] [--base http://127.0.0.1:3005]
// 각 과업(T1~T6)마다 <out>/<label>/T<n>/NN-<slug>.png 와 steps.json 을 남긴다.
// 셀렉터는 역할/레이블/텍스트를 먼저 시도하고, 화면 문구가 바뀌어도 버티도록 data-cy 를 마지막 대안으로 둔다.
// 한 단계가 실패해도 ok:false 로 기록하고 다음 단계로 넘어간다.

import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const args = parseArgs(process.argv.slice(2));
const LABEL = args.label ?? 'baseline';
const OUT = path.resolve(args.out ?? './runs');
const BASE = (args.base ?? 'http://127.0.0.1:3005').replace(/\/$/, '');
const ONLY = args.only ? new Set(args.only.split(',').map((t) => t.trim().toUpperCase())) : null;
const EXECUTABLE =
  process.env.UT_CHROMIUM ??
  '/Users/yeonjun/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const PASSWORD = 'demo1234';
const ACCOUNTS = {
  newcomer: '20260002', // 첫 로그인 → 세종대 회원가입
  leader: '20260001', // 김민지, 프로젝트 101·103·105… 리더
  member: '20250012', // 이준호, 102·104… 리더 (지원자 역할로 사용)
};
// T3에서 이준호가 지원할 프로젝트(김민지 리더, 백엔드 모집)
const APPLY_PROJECT = { id: 103, name: 'API 챌린지' };
// T5에서 김민지가 지원자를 처리할 프로젝트와, 미리 지원서를 넣어 둘 다른 사용자들
const MANAGE_PROJECT = { id: 101, name: '캠퍼스 메이커스', positionCode: 'WEB_FRONTEND' };
const SEED_APPLICANTS = [
  { studentId: '20251001', motivation: '프론트엔드 경험을 살려 캠퍼스 메이커스에 기여하고 싶습니다.' },
  { studentId: '20251002', motivation: '서버 경험은 있지만 프론트도 배우고 싶어 지원합니다. 성실히 참여할게요.' },
  { studentId: '20251003', motivation: 'UI 설계부터 구현까지 함께하고 싶어서 지원합니다. 잘 부탁드립니다.' },
];

const CONTACT_PATTERN = /연락|제안|메시지|쪽지|초대|채팅|DM|스카우트|팀\s*초대|함께하기|커피챗|이메일|메일/;
const SIGNUP_PATTERN = /회원\s*가입|가입하기|계정\s*만들기|sign\s*-?\s*up|처음이신가요|신규/i;

// ───────────────────────── 기록기 ─────────────────────────

class Recorder {
  constructor(page, taskId) {
    this.page = page;
    this.taskId = taskId;
    this.dir = path.join(OUT, LABEL, taskId);
    this.steps = [];
    this.dialogs = [];
    page.on('dialog', async (dialog) => {
      this.dialogs.push({ type: dialog.type(), message: dialog.message() });
      await dialog.accept().catch(() => {});
    });
  }

  // 단계 사이에 잠깐 떴다 사라지는 화면(확인 창 등)을 따로 찍을 때 쓴다.
  extraShotPath(slug) {
    const index = String(this.steps.length + 1).padStart(2, '0');
    return path.join(this.dir, `${index}a-${slug}.png`);
  }

  async init() {
    await fs.rm(this.dir, { recursive: true, force: true });
    await fs.mkdir(this.dir, { recursive: true });
  }

  // fn 이 반환한 객체는 uiState.extra 로 들어간다(관찰값 기록용).
  // quick: 토스트가 사라지기 전에 찍어야 하는 단계. 네트워크 유휴 대기를 건너뛴다.
  async step(slug, intent, action, fn, { settleMs = 600, quick = false } = {}) {
    const index = String(this.steps.length + 1).padStart(2, '0');
    const file = `${index}-${slug}.png`;
    const record = {
      step: this.steps.length + 1,
      intent,
      action,
      url: null,
      screenshot: path.join(LABEL, this.taskId, file),
      visibleText: '',
      uiState: {},
      ok: true,
      error: null,
    };
    let extra = null;
    try {
      extra = (await fn()) ?? null;
    } catch (error) {
      record.ok = false;
      record.error = String(error?.message ?? error).split('\n')[0].slice(0, 400);
    }
    await settle(this.page, settleMs, { quick });
    try {
      record.url = this.page.url();
      // 고정 헤더가 전체 페이지 캡처 중간에 끼지 않도록 맨 위로 올린 뒤 찍는다.
      await this.page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
      await this.page.waitForTimeout(300);
      const snapshot = await captureUiState(this.page);
      record.visibleText = snapshot.visibleText;
      delete snapshot.visibleText;
      record.uiState = { ...snapshot, nativeDialogs: this.dialogs.splice(0) };
      if (extra) record.uiState.extra = extra;
      await this.page.screenshot({ path: path.join(this.dir, file), fullPage: true });
    } catch (error) {
      record.ok = false;
      record.error = [record.error, `capture: ${String(error?.message ?? error).split('\n')[0]}`]
        .filter(Boolean)
        .join(' | ');
    }
    this.steps.push(record);
    const mark = record.ok ? 'ok ' : 'ERR';
    console.log(`[${this.taskId}] ${mark} ${index}-${slug}${record.error ? `  → ${record.error}` : ''}`);
    return record;
  }

  async save() {
    await fs.writeFile(path.join(this.dir, 'steps.json'), JSON.stringify(this.steps, null, 2));
  }
}

// ───────────────────────── 페이지 도우미 ─────────────────────────

async function settle(page, ms = 600, { quick = false } = {}) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  if (!quick) await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  await page
    .getByText('데모 데이터를 준비하고 있습니다')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(ms);
}

async function go(page, route) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await settle(page, 800);
}

// 후보 로케이터 중 처음으로 화면에 보이는 것을 고른다.
async function pick(page, candidates, { timeout = 8000, what = '요소' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const make of candidates) {
      const locator = (typeof make === 'function' ? make(page) : page.locator(make)).first();
      if ((await locator.count().catch(() => 0)) > 0 && (await locator.isVisible().catch(() => false))) {
        return locator;
      }
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`${what}을(를) 찾지 못함`);
}

// 체크박스·라디오처럼 sr-only 로 숨겨진 입력은 visible 검사를 건너뛴다.
async function pickAttached(page, candidates, { timeout = 8000, what = '요소' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const make of candidates) {
      const locator = (typeof make === 'function' ? make(page) : page.locator(make)).first();
      if ((await locator.count().catch(() => 0)) > 0) return locator;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`${what}을(를) 찾지 못함`);
}

async function chooseOption(page, text) {
  const option = await pick(
    page,
    [
      (p) => p.getByRole('option', { name: text }),
      (p) => p.locator('ul button, ul li, [role=listbox] *').filter({ hasText: text }),
    ],
    { what: `옵션 "${text}"` },
  );
  await option.click();
}

async function visibleOptions(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[role=option], ul button, [role=listbox] li')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map((el) => el.innerText.trim())
      .filter(Boolean),
  );
}

async function chipLabels(page, groupLabel) {
  // 그룹 제목(예: "분야") 바로 다음에 오는 버튼 묶음의 텍스트를 모은다.
  return page.evaluate((label) => {
    const heading = [...document.querySelectorAll('h1,h2,h3,h4,p,span,label,legend,dt')].find(
      (el) => el.childElementCount === 0 && el.textContent.trim() === label,
    );
    if (!heading) return null;
    let box = heading.parentElement;
    for (let depth = 0; depth < 4 && box; depth += 1) {
      // after 라운드에서 일부 칩이 라디오로 바뀌었으므로 버튼과 라디오를 모두 본다.
      const radios = [...box.querySelectorAll('input[type=radio],[role=radio]')];
      if (radios.length >= 2) {
        return radios.map((r) => ({
          text: (r.closest('label')?.innerText ?? r.getAttribute('aria-label') ?? r.innerText ?? '').trim(),
          pressed: String(r.checked ?? r.getAttribute('aria-checked') === 'true'),
          kind: 'radio',
        }));
      }
      const buttons = [...box.querySelectorAll('button,[role=button]')];
      if (buttons.length >= 2) {
        return buttons.map((b) => ({
          text: b.innerText.trim(),
          pressed: b.getAttribute('aria-pressed'),
        }));
      }
      box = box.parentElement;
    }
    return null;
  }, groupLabel);
}

async function login(page, studentId, { consent = true } = {}) {
  await go(page, '/auth/login');
  await (await pick(page, [(p) => p.getByLabel('학번', { exact: true }), (p) => p.getByPlaceholder(/학번/), '[data-cy=login-student-id]'], { what: '학번 입력' })).fill(studentId);
  await (await pick(page, [(p) => p.getByLabel('비밀번호', { exact: true }), 'input[type=password]', '[data-cy=login-password]'], { what: '비밀번호 입력' })).fill(PASSWORD);
  if (consent) {
    const box = await pickAttached(page, [(p) => p.getByRole('checkbox'), '[data-cy=login-consent]'], { what: '동의 체크박스' });
    if (!(await box.isChecked())) await box.check({ force: true });
  }
  const submit = await pick(page, [(p) => p.getByRole('button', { name: /^로그인/ }), '[data-cy=login-submit]'], { what: '로그인 버튼' });
  await submit.click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 20000 });
  await settle(page, 800);
}

// 같은 브라우저 컨텍스트(localStorage)에 다른 사용자의 지원서를 미리 넣는다. MSW 목업 API를 그대로 호출한다.
async function seedApplications(page, project, applicants) {
  await go(page, '/');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 30000 });
  return page.evaluate(
    async ({ project, applicants, password }) => {
      const results = [];
      for (const applicant of applicants) {
        const loginRes = await fetch('/api/v1/auth/login/sejong', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: applicant.studentId, password }),
        });
        const applyRes = await fetch(`/api/v1/projects/${project.id}/application`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobPositionCode: project.positionCode, motivation: applicant.motivation }),
        });
        results.push({ studentId: applicant.studentId, login: loginRes.status, apply: applyRes.status, body: (await applyRes.text()).slice(0, 200) });
      }
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      return results;
    },
    { project, applicants, password: PASSWORD },
  );
}

// ───────────────────────── 화면 상태 수집 ─────────────────────────

const TOAST_OBSERVER = () => {
  window.__utMessages = [];
  const seen = new WeakSet();
  const scan = () => {
    document.querySelectorAll('[role=status],[role=alert],[aria-live]').forEach((el) => {
      const text = el.innerText?.trim();
      if (!text || seen.has(el)) return;
      seen.add(el);
      window.__utMessages.push({ role: el.getAttribute('role') ?? 'live', text: text.slice(0, 200), at: Date.now() });
    });
  };
  new MutationObserver(scan).observe(document, { childList: true, subtree: true, characterData: true });
};

async function captureUiState(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const clean = (s, n = 160) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
    const labelOf = (el) => {
      if (el.id) {
        const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (l) return clean(l.innerText, 80);
      }
      const wrap = el.closest('label');
      if (wrap) return clean(wrap.innerText, 80);
      return clean(el.getAttribute('aria-label') || el.placeholder || el.name || '', 80);
    };

    const root = document.querySelector('main') ?? document.body;
    const visibleText = clean(root.innerText, 1500);

    const disabledButtons = [...document.querySelectorAll('button,[role=button]')]
      .filter(visible)
      .filter((b) => b.disabled || b.getAttribute('aria-disabled') === 'true')
      .map((b) => {
        const described = (b.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => document.getElementById(id)?.innerText)
          .filter(Boolean)
          .join(' ');
        const reason = clean(b.title || described, 160) || null;
        return { text: clean(b.innerText || b.getAttribute('aria-label'), 60), reasonShown: Boolean(reason), reason };
      });

    const messages = [...document.querySelectorAll('[role=alert],[role=status],[aria-live]')]
      .filter(visible)
      .map((el) => ({ role: el.getAttribute('role') ?? 'live', text: clean(el.innerText, 200) }))
      .filter((m) => m.text);

    const dialogs = [...document.querySelectorAll('[role=dialog],[role=alertdialog],[aria-modal=true]')]
      .filter(visible)
      .map((el) => clean(el.innerText, 400));

    const counters = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const counterPattern = /(\d+\s*\/\s*\d+\s*자)|(총\s*\d+\+?\s*(개|명)[^|]{0,12})|(지원자 목록\s*\d+)|(\d+\s*\/\s*\d+\s*명)/;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      const text = clean(parent?.innerText, 60);
      if (parent && visible(parent) && counterPattern.test(text) && !counters.includes(text)) counters.push(text);
      if (counters.length >= 12) break;
    }

    const invalidFields = [...document.querySelectorAll('[aria-invalid=true]')].filter(visible).map(labelOf);

    const pressed = [...document.querySelectorAll('[aria-pressed]')]
      .filter(visible)
      .map((el) => ({ text: clean(el.innerText, 40), pressed: el.getAttribute('aria-pressed') }));

    const checks = [...document.querySelectorAll('input[type=checkbox],input[type=radio]')].map((el) => ({
      label: labelOf(el),
      type: el.type,
      checked: el.checked,
    }));

    const fields = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]),textarea,select')]
      .filter(visible)
      .map((el) => ({
        label: labelOf(el),
        value: el.type === 'password' ? (el.value ? '••••' : '') : clean(el.value, 120),
        disabled: el.disabled,
        maxLength: el.maxLength > 0 ? el.maxLength : undefined,
      }));

    const transientMessages = (window.__utMessages ?? []).splice(0);

    return { visibleText, disabledButtons, messages, transientMessages, dialogs, counters, invalidFields, pressed, checks, fields };
  });
}

// ───────────────────────── 과업 ─────────────────────────

async function T1(page, rec) {
  await rec.step('home', '처음 방문해서 서비스가 무엇인지 보고 가입할 방법을 찾는다', '홈(/) 접속', async () => {
    await go(page, '/');
    return { signupEntryOnHome: await page.getByText(SIGNUP_PATTERN).count() };
  });

  await rec.step('login-page', '가입 버튼이 없어 보이니 상단의 "로그인"을 눌러 본다', '헤더의 "로그인" 링크 클릭', async () => {
    const link = await pick(page, [(p) => p.getByRole('link', { name: /^로그인$/ }), (p) => p.getByRole('button', { name: /^로그인$/ })], { what: '헤더 로그인 링크' });
    await link.click();
    await page.waitForURL(/\/auth\/login/, { timeout: 20000 });
  });

  await rec.step('look-for-signup', '로그인 화면에서 "회원가입" 입구를 찾는다', '로그인 화면에서 회원가입 관련 링크·버튼·문구를 검색', async () => {
    const matches = await page.getByText(SIGNUP_PATTERN).allInnerTexts();
    const links = await page.getByRole('link').allInnerTexts();
    return { signupTextMatches: matches, linksOnLoginPage: links.map((t) => t.trim()).filter(Boolean) };
  });

  await rec.step('guess-signup-url', '가입 화면 주소를 짐작해서 직접 들어가 본다', '/auth/sign-up 직접 접속', async () => {
    await go(page, '/auth/sign-up');
    return { landedOn: new URL(page.url()).pathname };
  });

  await rec.step('fill-credentials', '그냥 학번과 비밀번호를 넣어 본다', '학번(신규 20260002)과 비밀번호 입력, 동의 체크는 하지 않음', async () => {
    if (!page.url().includes('/auth/login')) await go(page, '/auth/login');
    await (await pick(page, [(p) => p.getByLabel('학번', { exact: true }), (p) => p.getByPlaceholder(/학번/)], { what: '학번 입력' })).fill(ACCOUNTS.newcomer);
    await (await pick(page, [(p) => p.getByLabel('비밀번호', { exact: true }), 'input[type=password]'], { what: '비밀번호 입력' })).fill(PASSWORD);
    const button = await pick(page, [(p) => p.getByRole('button', { name: /^로그인/ })], { what: '로그인 버튼' });
    return { loginButtonDisabled: await button.isDisabled() };
  });

  await rec.step('click-login-without-consent', '"로그인"을 누른다(동의 체크를 놓친 상태)', '로그인 버튼 클릭 시도(비활성이면 강제 클릭으로 사용자의 헛클릭을 재현)', async () => {
    const button = await pick(page, [(p) => p.getByRole('button', { name: /^로그인/ })], { what: '로그인 버튼' });
    const disabled = await button.isDisabled();
    const before = page.url();
    if (disabled) await button.click({ force: true, timeout: 3000 }).catch(() => {});
    else await button.click();
    await page.waitForTimeout(1200);
    return { loginButtonDisabled: disabled, urlChanged: page.url() !== before };
  });

  await rec.step('check-consent', '왜 안 되는지 살피다 동의 문구 체크박스를 누른다', '동의 문구(체크박스 레이블) 클릭', async () => {
    const box = await pickAttached(page, [(p) => p.getByRole('checkbox'), '[data-cy=login-consent]'], { what: '동의 체크박스' });
    const labelText = page.getByText(/비밀번호는 저장하지 않/);
    if (await labelText.count()) await labelText.first().click();
    if (!(await box.isChecked())) await box.check({ force: true });
    const button = await pick(page, [(p) => p.getByRole('button', { name: /^로그인/ })], { what: '로그인 버튼' });
    return { consentChecked: await box.isChecked(), loginButtonDisabled: await button.isDisabled() };
  });

  await rec.step('submit-login', '로그인한다', '로그인 버튼 클릭 → 신규 회원이면 가입 화면으로 이동하는지 확인', async () => {
    await (await pick(page, [(p) => p.getByRole('button', { name: /^로그인/ })], { what: '로그인 버튼' })).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 20000 });
    return { landedOn: new URL(page.url()).pathname };
  }, { settleMs: 1200 });

  await rec.step('signup-submit-empty', '가입 화면에서 무엇이 필수인지 모른 채 바로 완료를 눌러 본다', '"회원가입 완료"(제출 버튼) 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('button', { name: /가입\s*완료|회원가입|가입하기/ }), '[data-cy=sejong-signup-submit]'], { what: '가입 제출 버튼' })).click();
    await page.waitForTimeout(800);
  }, { settleMs: 200, quick: true });

  await rec.step('signup-basic-info', '이름, 생년월일, 성별을 입력한다', '이름·생년월일·성별(여성) 입력', async () => {
    // 학교 확인 가입 이후 이름은 학교에서 받아 표시만 하므로 입력칸이 없을 수 있다.
    const nameInput = await pick(page, [(p) => p.getByLabel('이름', { exact: true }), (p) => p.getByPlaceholder(/실명/), '[data-cy=signup-name]'], { what: '이름 입력', timeout: 1500 }).catch(() => null);
    if (nameInput) await nameInput.fill('합성참여자');
    await (await pick(page, [(p) => p.getByLabel('생년월일'), 'input[type=date]', '[data-cy=signup-birth]'], { what: '생년월일 입력' })).fill('2003-04-12');
    const female = await pick(page, [(p) => p.getByText('여성', { exact: true }), 'label[for=female]'], { what: '여성 선택' });
    await female.click();
  });

  await rec.step('signup-field-options', '내 분야(디자인)를 고르려고 직군 목록을 연다', '직군 드롭다운 열기, 보이는 옵션 기록', async () => {
    const major = await pick(page, [(p) => p.getByRole('button', { name: /^직군/ }), '[data-cy=signup-interest-major-0]'], { what: '직군 드롭다운' });
    await major.click();
    await page.waitForTimeout(300);
    return { majorOptions: await visibleOptions(page) };
  });

  await rec.step('signup-field-select', '디자인 → 상세 분야를 고른다', '직군 "디자인", 상세 분야 첫 항목 선택, 상세 분야 옵션 기록', async () => {
    await chooseOption(page, /디자인/);
    const minor = await pick(page, [(p) => p.getByRole('button', { name: /^상세 분야/ }), '[data-cy=signup-interest-minor-0]'], { what: '상세 분야 드롭다운' });
    await minor.click();
    await page.waitForTimeout(300);
    const minorOptions = await visibleOptions(page);
    await chooseOption(page, minorOptions.find((o) => /디자인/.test(o)) ?? minorOptions[0]);
    return { minorOptions };
  });

  await rec.step('signup-submit-no-tech', '"기술 스택(선택)"이라고 되어 있으니 비워 두고 완료를 누른다', '기술 스택 없이 "회원가입 완료" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('button', { name: /가입\s*완료|회원가입|가입하기/ }), '[data-cy=sejong-signup-submit]'], { what: '가입 제출 버튼' })).click();
    await page.waitForTimeout(800);
    return { stillOnSignup: /\/auth\/sign-up/.test(page.url()) };
  }, { settleMs: 200, quick: true });

  await rec.step('signup-tech', '기술 스택을 하나 넣는다', '기술 스택 입력에 "Figma" 입력 후 Enter', async () => {
    const input = await pick(page, [(p) => p.getByLabel(/기술 스택/), (p) => p.getByPlaceholder(/기술/), '[data-cy=signup-tech-input]', '#tech'], { what: '기술 스택 입력' });
    await input.fill('Figma');
    await input.press('Enter');
    await page.waitForTimeout(400);
  });

  await rec.step('signup-complete', '가입을 마친다', '"회원가입 완료" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('button', { name: /가입\s*완료|회원가입|가입하기/ }), '[data-cy=sejong-signup-submit]'], { what: '가입 제출 버튼' })).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/sign-up'), { timeout: 20000 });
    return { landedOn: new URL(page.url()).pathname, profileMenu: await page.getByLabel('프로필 메뉴').count() };
  }, { settleMs: 1200 });
}

async function T2(page, rec) {
  await rec.step('login', '로그인한다(이준호, 백엔드)', `학번 ${ACCOUNTS.member} 로그인`, () => login(page, ACCOUNTS.member));

  await rec.step('projects-list', '프로젝트 목록으로 간다', '헤더 "프로젝트 찾기" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /^프로젝트 찾기$/ })], { what: '프로젝트 찾기 링크' })).click();
    await page.waitForURL(/\/projects(\?|$)/, { timeout: 20000 });
    await settle(page, 800);
    return { fieldChips: await chipLabels(page, '분야'), platformChips: await chipLabels(page, '플랫폼') };
  });

  await rec.step('filter-recruiting', '모집 중인 것만 본다', '상태 선택에서 "모집 중만 보기" 선택', async () => {
    const select = page.locator('select').filter({ has: page.locator('option', { hasText: '모집 중' }) }).first();
    if (await select.count()) {
      const label = (await select.locator('option', { hasText: '모집 중' }).first().innerText()).trim();
      await select.selectOption({ label });
    } else {
      await (await pick(page, [(p) => p.getByRole('button', { name: /모집\s*중/ }), (p) => p.getByLabel(/모집\s*중/)], { what: '모집 중 필터' })).click();
    }
  });

  for (const [slug, label, intent] of [
    ['filter-field-planning', '기획', '내 분야가 기획/PM이라면 "기획"을 눌러 본다'],
    ['filter-field-marketing', '마케팅', '"마케팅"도 눌러 본다'],
    ['filter-field-design', '디자인', '"디자인"을 눌러 본다'],
    ['filter-field-backend', '백엔드', '내 분야인 "백엔드"로 거른다'],
  ]) {
    await rec.step(slug, intent, `분야 칩 "${label}" 클릭`, async () => {
      await (await pick(page, [(p) => p.getByRole('button', { name: label, exact: true })], { what: `분야 칩 ${label}` })).click();
      await settle(page, 600);
      const cards = await page.locator('a[href^="/projects/"]').filter({ hasText: /마감|모집/ }).allInnerTexts();
      return { resultCards: cards.map((c) => c.replace(/\s+/g, ' ').slice(0, 90)) };
    });
  }

  await rec.step('open-detail', `목록에서 "${APPLY_PROJECT.name}"를 열어 본다`, `"${APPLY_PROJECT.name}" 카드 클릭`, async () => {
    const card = await pick(page, [(p) => p.getByRole('link', { name: new RegExp(APPLY_PROJECT.name) })], { what: '프로젝트 카드' }).catch(async () => {
      await go(page, `/projects/${APPLY_PROJECT.id}`);
      return null;
    });
    if (card) await card.click();
    await page.waitForURL(new RegExp(`/projects/${APPLY_PROJECT.id}`), { timeout: 20000 });
    await settle(page, 800);
  });

  await rec.step('detail-intro-tab', '리더와 팀, 얼마나 시간이 드는지 알아보려고 "소개" 탭을 연다', '"소개" 탭 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('tab', { name: '소개' }), (p) => p.getByRole('button', { name: '소개', exact: true })], { what: '소개 탭' })).click();
  });

  await rec.step('detail-leader', '리더가 어떤 사람인지 확인하려고 리더 이름을 누른다', '리더 이름(프로필 링크) 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /Project Lead|리더/ }), (p) => p.locator('a[href^="/profile/"]')], { what: '리더 링크' })).click();
    await page.waitForURL(/\/profile\//, { timeout: 20000 });
  });
}

async function T3(page, rec) {
  const valid = '백엔드 API 설계와 Node.js 서버 개발 경험이 있어서 팀에 기여하고 싶습니다. 주 10시간 이상 참여할 수 있어요.';

  await rec.step('login', '로그인한다(이준호)', `학번 ${ACCOUNTS.member} 로그인`, () => login(page, ACCOUNTS.member));

  await rec.step('project-detail', `T2에서 찾은 "${APPLY_PROJECT.name}" 상세를 연다`, `/projects/${APPLY_PROJECT.id} 접속`, () => go(page, `/projects/${APPLY_PROJECT.id}`));

  await rec.step('open-apply', '모집 포지션의 "지원하기"를 누른다', '"지원하기" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /지원하기/ }), (p) => p.getByRole('button', { name: /지원하기/ })], { what: '지원하기' })).click();
    await page.waitForURL(/\/apply/, { timeout: 20000 });
    await settle(page, 1000);
    const text = await page.locator('main').innerText().catch(() => page.locator('body').innerText());
    return { minLengthHintVisible: /10\s*자/.test(text) };
  });

  const messageBox = () => pick(page, [(p) => p.getByRole('textbox', { name: /지원|메시지|사유|동기/ }), (p) => p.getByPlaceholder(/메시지|지원|사유|동기/), 'textarea'], { what: '지원 메시지 입력' });
  const submitButton = () => pick(page, [(p) => p.getByRole('button', { name: /지원서 보내기|지원하기|제출/ }), '[data-cy=project-application-submit]'], { what: '제출 버튼' });

  await rec.step('type-short', '짧게 한마디만 쓴다', '지원 메시지에 "열심히할게" (5자) 입력', async () => {
    await (await messageBox()).fill('열심히할게');
  });

  await rec.step('submit-short', '바로 보낸다', '"지원서 보내기" 클릭 (5자 상태)', async () => {
    await (await submitButton()).click();
    await page.waitForTimeout(1200);
    return { stillOnApply: /\/apply$/.test(new URL(page.url()).pathname) };
  }, { settleMs: 200, quick: true });

  await rec.step('type-valid', '오류를 보고 길게 다시 쓴다', `지원 메시지를 ${valid.length}자 문장으로 교체`, async () => {
    await (await messageBox()).fill(valid);
  });

  await rec.step('go-edit-profile', '프로필이 부족해 보여 "프로필 수정"을 누른다(쓰던 메시지는 그대로 둠)', '"프로필 수정" 클릭', async () => {
    const before = new URL(page.url()).pathname;
    await (await pick(page, [(p) => p.getByRole('button', { name: /프로필 수정/ }), (p) => p.getByRole('link', { name: /프로필 수정/ })], { what: '프로필 수정 버튼' })).click();
    await page.waitForURL((url) => url.pathname !== before, { timeout: 15000 }).catch(() => {});
    return { navigatedTo: new URL(page.url()).pathname };
  }, { settleMs: 1000 });

  await rec.step('come-back', '프로필을 보고 지원서로 돌아간다', '브라우저 뒤로 가기', async () => {
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    if (!/\/apply/.test(page.url())) await go(page, `/projects/${APPLY_PROJECT.id}/apply`);
    await settle(page, 1200);
    const box = await messageBox();
    const value = await box.inputValue();
    return { messageValueAfterReturn: value, messageLost: value !== valid };
  }, { settleMs: 200 });

  await rec.step('retype-and-submit', '사라진 메시지를 다시 쓰고 보낸다', '메시지 재입력 후 "지원서 보내기" 클릭', async () => {
    const box = await messageBox();
    if ((await box.inputValue()) !== valid) await box.fill(valid);
    await (await submitButton()).click();
    await page.waitForURL(/\/apply\/\d+/, { timeout: 20000 });
  }, { settleMs: 800, quick: true });

  await rec.step('my-applications', '내 지원 현황에서 다시 확인한다', '/profile/applications 접속', () => go(page, '/profile/applications'));
}

async function createStepNext(page) {
  await (await pick(page, [(p) => p.getByRole('button', { name: /^다음$/ })], { what: '"다음" 버튼' })).click();
  await page.waitForTimeout(500);
}

async function T4(page, rec) {
  await rec.step('login', '리더로 로그인한다(김민지)', `학번 ${ACCOUNTS.leader} 로그인`, () => login(page, ACCOUNTS.leader));

  await rec.step('open-create', '새 프로젝트를 등록하러 간다', '헤더 "프로젝트 등록하기" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /프로젝트 등록/ }), (p) => p.getByRole('button', { name: /프로젝트 등록/ })], { what: '프로젝트 등록 링크' })).click();
    await page.waitForURL(/\/projects\/create/, { timeout: 20000 });
    await settle(page, 1000);
    return { platformChips: await chipLabels(page, '출시 플랫폼') };
  });

  await rec.step('next-empty', '일단 "다음"을 눌러 본다', '아무것도 입력하지 않고 "다음" 클릭', () => createStepNext(page), { settleMs: 200, quick: true });

  await rec.step('basic-info', '프로젝트 이름과 카테고리를 정한다', '프로젝트 명 입력, 카테고리 "캡스톤" 선택', async () => {
    await (await pick(page, [(p) => p.getByLabel(/프로젝트 명/), (p) => p.getByPlaceholder(/프로젝트 이름/), '[data-cy=project-form-name]'], { what: '프로젝트 명' })).fill('합성 UT 테스트 프로젝트');
    await (await pick(page, [(p) => p.getByRole('button', { name: /캡스톤/ }), (p) => p.getByText('캡스톤', { exact: true }), '[data-cy=project-form-category-capstone]'], { what: '캡스톤 카테고리' })).click();
  });

  await rec.step('platform-multi', '웹과 앱 둘 다 낼 거라 iOS와 안드로이드를 차례로 누른다', '플랫폼 칩 "iOS" 클릭 후 "안드로이드" 클릭', async () => {
    await (await pick(page, [(p) => p.locator('label').filter({ hasText: /^\s*iOS\s*$/ }), (p) => p.getByRole('button', { name: 'iOS', exact: true })], { what: 'iOS 칩' })).click();
    await page.waitForTimeout(200);
    const afterFirst = await chipLabels(page, '출시 플랫폼');
    await (await pick(page, [(p) => p.locator('label').filter({ hasText: /^\s*안드로이드\s*$/ }), (p) => p.getByRole('button', { name: '안드로이드', exact: true })], { what: '안드로이드 칩' })).click();
    await page.waitForTimeout(200);
    const afterSecond = await chipLabels(page, '출시 플랫폼');
    const selected = (afterSecond ?? []).filter((c) => c.pressed === 'true').map((c) => c.text);
    return { afterIos: afterFirst, afterAndroid: afterSecond, selectedPlatforms: selected, multiSelectWorked: selected.length > 1 };
  });

  await rec.step('step2', '다음 단계로 간다', '"다음" 클릭', () => createStepNext(page));

  await rec.step('description', '프로젝트 소개를 쓴다', '소개 글 입력', async () => {
    await (await pick(page, [(p) => p.getByPlaceholder(/소개 글/), (p) => p.getByRole('textbox', { name: /소개/ }), '[data-cy=project-form-description] textarea', 'textarea'], { what: '소개 글 입력' })).fill('캠퍼스 문제를 함께 해결하는 웹 서비스를 만듭니다. 매주 화요일 저녁에 회의합니다.');
  });

  await rec.step('step3', '다음 단계로 간다', '"다음" 클릭', () => createStepNext(page));

  await rec.step('roles', '내 분야와 모집할 분야를 고른다', '나의 분야: 프론트/웹 프론트엔드, 모집 분야: 디자인/첫 상세 분야', async () => {
    const dropdown = (cy, index) => pick(page, ['[data-cy=' + cy + ']', (p) => p.getByRole('button', { name: /직군 선택/ }).nth(index)], { what: cy });
    await (await dropdown('project-form-my-major', 0)).click();
    const majorOptions = await visibleOptions(page);
    await chooseOption(page, /^프론트/);
    await (await pick(page, ['[data-cy=project-form-my-minor]', (p) => p.getByRole('button', { name: /상세 분야 선택/ })], { what: '나의 상세 분야' })).click();
    await chooseOption(page, /웹 프론트엔드/);
    await (await dropdown('project-form-recruit-major-0', 0)).click();
    await chooseOption(page, /^디자인/);
    await (await pick(page, ['[data-cy=project-form-recruit-minor-0]', (p) => p.getByRole('button', { name: /상세 분야 선택/ })], { what: '모집 상세 분야' })).click();
    const minorOptions = await visibleOptions(page);
    await chooseOption(page, minorOptions[0]);
    return { majorOptions, recruitMinorOptions: minorOptions };
  });

  await rec.step('step4', '기술 스택 단계로 간다(기술 스택은 아직 고르지 않음)', '"다음" 클릭', () => createStepNext(page));

  await rec.step('until-complete', '마감은 "모집 완료 시까지"로 한다', '"모집 완료 시까지" 체크', async () => {
    const box = await pickAttached(page, [(p) => p.getByLabel(/모집 완료 시까지/), '[data-cy=project-form-until-complete]'], { what: '모집 완료 시까지' });
    await box.check({ force: true });
  });

  await rec.step('submit-without-tech', '바로 등록한다', '"프로젝트 등록하기" 클릭(기술 스택 없이)', async () => {
    await (await pick(page, [(p) => p.getByRole('button', { name: /프로젝트 등록하기|등록하기/ }), '[data-cy=project-form-submit]'], { what: '등록 버튼' })).click();
    await page.waitForTimeout(1200);
    return { stillOnCreate: /\/projects\/create/.test(page.url()) };
  }, { settleMs: 200, quick: true });

  await rec.step('add-tech', '오류를 보고 기술 스택을 넣는다', '기술 스택 입력에 "Figma" 입력 후 Enter', async () => {
    const input = await pick(page, [(p) => p.getByLabel(/기술 스택/), '[data-cy=project-form-tech-input-0]', '#tech', (p) => p.getByPlaceholder(/기술/)], { what: '기술 스택 입력' });
    await input.fill('Figma');
    await input.press('Enter');
    await page.waitForTimeout(400);
  });

  await rec.step('submit', '다시 등록한다', '"프로젝트 등록하기" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('button', { name: /프로젝트 등록하기|등록하기/ }), '[data-cy=project-form-submit]'], { what: '등록 버튼' })).click();
    await page.waitForURL(/\/projects\/\d+/, { timeout: 20000 });
  }, { settleMs: 1200 });
}

async function T5(page, rec) {
  await rec.step('seed', '(사전 준비) 다른 학생 3명이 김민지의 프로젝트에 지원해 둔 상태를 만든다', `목업 API로 ${SEED_APPLICANTS.map((a) => a.studentId).join(', ')} 로그인 후 /projects/${MANAGE_PROJECT.id} 지원`, async () => {
    const results = await seedApplications(page, MANAGE_PROJECT, SEED_APPLICANTS);
    if (results.some((r) => r.apply !== 200)) throw new Error(`지원서 시드 실패: ${JSON.stringify(results)}`);
    return { seeded: results };
  });

  await rec.step('login', '리더로 로그인한다(김민지)', `학번 ${ACCOUNTS.leader} 로그인`, () => login(page, ACCOUNTS.leader));

  await rec.step('notifications', '지원이 왔는지 알림을 확인한다', '/notifications 접속', () => go(page, '/notifications'));

  await rec.step('project-detail', '내 프로젝트 상세로 간다', `/projects/${MANAGE_PROJECT.id} 접속`, async () => {
    await go(page, `/projects/${MANAGE_PROJECT.id}`);
    const manageLinks = await page.getByRole('link', { name: /관리/ }).allInnerTexts();
    const manageButtons = await page.getByRole('button', { name: /관리/ }).allInnerTexts();
    return { manageEntries: [...manageLinks, ...manageButtons].map((t) => t.trim()) };
  });

  await rec.step('open-manage', '프로젝트 관리 화면으로 들어간다', '"관리" 링크/버튼 클릭', async () => {
    const entry = await pick(page, [(p) => p.getByRole('link', { name: /관리/ }), (p) => p.getByRole('button', { name: /관리/ })], { what: '관리 진입' }).catch(() => null);
    if (entry) await entry.click();
    else await go(page, `/projects/${MANAGE_PROJECT.id}/manage`);
    await page.waitForURL(/\/manage/, { timeout: 20000 });
    return { enteredVia: entry ? 'click' : 'direct-url' };
  });

  await rec.step('open-applicants', '지원자 관리 탭을 연다', '"지원자 관리" 탭 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /지원자/ }), (p) => p.getByRole('tab', { name: /지원자/ }), (p) => p.getByRole('button', { name: /지원자 관리/ })], { what: '지원자 관리 탭' })).click();
    await page.waitForURL(/\/applicants/, { timeout: 20000 });
    await settle(page, 1000);
  });

  const decide = async (kind) => {
    const name = kind === 'approve' ? /^승인$/ : /^거절$/;
    const listBefore = await page.getByRole('listitem').allInnerTexts();
    const button = await pick(page, [(p) => p.getByRole('button', { name })], { what: `${kind} 버튼` });
    const item = button.locator('xpath=ancestor::li[1]');
    const target = (await item.innerText().catch(() => '')).split('\n').map((l) => l.trim()).find((l) => l.length > 1) ?? '';
    await button.click();
    await page.waitForTimeout(600);
    // after 라운드: 거절은 확인 창을 거친다. 확인 창을 찍어 두고 확인 버튼을 누른다.
    const dialog = page.getByRole('dialog');
    let confirmDialog = null;
    if (await dialog.count()) {
      confirmDialog = (await dialog.first().innerText()).replace(/\s+/g, ' ').slice(0, 200);
      await page.screenshot({ path: rec.extraShotPath(`${kind}-confirm-dialog`), fullPage: true });
      await dialog.first().getByRole('button', { name: /거절/ }).last().click();
    }
    await page.waitForTimeout(1500);
    const listAfter = await page.getByRole('listitem').allInnerTexts();
    return { target, itemsBefore: listBefore.length, itemsAfter: listAfter.length, confirmDialog };
  };

  const decided = {};
  await rec.step('approve', '첫 번째 지원자를 승인한다', '첫 지원자의 "승인" 클릭, 1.5초 대기 후 화면 확인', async () => {
    const result = await decide('approve');
    decided.approved = result.target;
    return result;
  }, { settleMs: 100, quick: true });
  await rec.step('reject', '다음 지원자를 거절한다', '다음 지원자의 "거절" 클릭, 1.5초 대기 후 화면 확인', async () => {
    const result = await decide('reject');
    decided.rejected = result.target;
    return result;
  }, { settleMs: 100, quick: true });

  await rec.step('verify-members', '승인한 사람이 정말 팀에 들어왔는지 팀원 관리 탭에서 확인한다', '"팀원 관리" 탭 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /팀원 관리/ }), (p) => p.getByRole('tab', { name: /팀원/ })], { what: '팀원 관리 탭' })).click();
    await page.waitForURL(/\/manage(\/members)?$/, { timeout: 20000 });
  });

  await rec.step('verify-members-list', '팀원 목록에 승인한 사람이 있는지 본다', '팀원 관리 화면에서 승인·거절한 이름 검색', async () => {
    const text = await page.locator('body').innerText();
    return { approvedName: decided.approved ?? null, approvedVisible: decided.approved ? text.includes(decided.approved) : null, rejectedName: decided.rejected ?? null, rejectedVisible: decided.rejected ? text.includes(decided.rejected) : null };
  });

  await rec.step('verify-rejected', '거절한 사람이 어디에 기록됐는지 지원자 관리 탭에서 다시 찾아본다', '"지원자 관리" 탭으로 돌아가 거절한 이름 검색', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /지원자/ }), (p) => p.getByRole('tab', { name: /지원자/ })], { what: '지원자 관리 탭' })).click();
    await page.waitForURL(/\/applicants/, { timeout: 20000 });
    await settle(page, 800);
    const text = await page.locator('body').innerText();
    return { rejectedName: decided.rejected ?? null, rejectedVisible: decided.rejected ? text.includes(decided.rejected) : null, hasHistoryTab: /거절됨|거절한 지원|처리 완료|지난 지원|전체 지원|처리 내역/.test(text) };
  });
}

async function T6(page, rec) {
  await rec.step('login', '리더로 로그인한다(김민지)', `학번 ${ACCOUNTS.leader} 로그인`, () => login(page, ACCOUNTS.leader));

  await rec.step('teammates', '함께할 사람을 찾으러 팀원 찾기로 간다', '헤더 "팀원 찾기" 클릭', async () => {
    await (await pick(page, [(p) => p.getByRole('link', { name: /^팀원 찾기$/ })], { what: '팀원 찾기 링크' })).click();
    await page.waitForURL(/\/teammates/, { timeout: 20000 });
    await settle(page, 1000);
    return { roleChips: await chipLabels(page, '분야') };
  });

  for (const [slug, label, intent] of [
    ['filter-planner', /^(PM\/기획|기획)$/, '기획자를 찾으려고 기획 칩을 누른다'],
    ['filter-designer', /^(디자이너|디자인)$/, '디자이너를 찾으려고 디자인 칩을 누른다'],
  ]) {
    // after 라운드에서 칩 이름이 통일됨(PM/기획→기획, 디자이너→디자인). 둘 다 받는다.
    await rec.step(slug, intent, `역할 칩 ${label} 클릭`, async () => {
      await (await pick(page, [(p) => p.getByRole('button', { name: label })], { what: `역할 칩 ${label}` })).click();
      await settle(page, 1200);
      const names = await page.locator('a[href^="/profile/"]').allInnerTexts();
      return { resultCount: names.length, results: names.map((n) => n.replace(/\s+/g, ' ').slice(0, 60)).slice(0, 10) };
    });
  }

  await rec.step('open-profile', '마음에 드는 디자이너의 프로필을 연다', '결과 첫 카드 클릭', async () => {
    await (await pick(page, [(p) => p.locator('main a[href^="/profile/"]'), (p) => p.locator('a[href^="/profile/"]')], { what: '팀원 카드' })).click();
    await page.waitForURL(/\/profile\/\d+/, { timeout: 20000 });
    await settle(page, 1000);
  });

  await rec.step('look-for-contact', '연락하거나 프로젝트에 제안할 버튼을 찾는다', '공개 프로필의 모든 버튼·링크를 수집하고 연락/제안 관련 항목을 검색', async () => {
    const root = page.locator('main').first();
    const scope = (await root.count()) ? root : page.locator('body');
    const buttons = (await scope.getByRole('button').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const links = await scope.getByRole('link').evaluateAll((els) => els.map((a) => `${a.innerText.trim()} -> ${a.getAttribute('href')}`));
    const contactLike = [...buttons, ...links].filter((t) => /연락|제안|메시지|쪽지|초대|채팅|DM|스카우트|커피챗|mailto:/.test(t));
    const emailVisible = /@[\w.-]+\.\w+/.test(await scope.innerText());
    return { buttons, links, contactLike, emailVisible };
  });

  // after 라운드: 제안 버튼이 생겼다면 실제로 제안을 보내 본다.
  const proposeButton = page.locator('main').first().getByRole('button', { name: /제안/ });
  if (await proposeButton.count()) {
    await rec.step('open-proposal', '"제안 보내기"를 눌러 내 프로젝트로 함께하자고 제안한다', '"제안" 버튼 클릭 후 대화상자 확인', async () => {
      await proposeButton.first().click();
      await page.getByRole('dialog').first().waitFor({ timeout: 10000 });
      await page.waitForTimeout(800);
      return { dialogText: (await page.getByRole('dialog').first().innerText()).replace(/\s+/g, ' ').slice(0, 400) };
    });
    await rec.step('send-proposal', '짧은 메시지를 쓰고 제안을 보낸다', '메시지 입력 후 "제안 보내기" 클릭', async () => {
      const dialog = page.getByRole('dialog').first();
      const box = dialog.locator('textarea');
      if (await box.count()) await box.first().fill('포트폴리오 보고 연락드려요. 디자인 파트를 함께 맡아주시면 좋겠어요!');
      await dialog.getByRole('button', { name: /제안 보내기/ }).last().click();
      await page.waitForTimeout(1500);
      return { dialogStillOpen: (await page.getByRole('dialog').count()) > 0 };
    }, { settleMs: 100, quick: true });
  }

  await rec.step('try-manage-members', '내 프로젝트 관리 화면에 초대 기능이 있는지 찾아본다', `/projects/${MANAGE_PROJECT.id}/manage/members 접속 후 초대 관련 항목 검색`, async () => {
    await go(page, `/projects/${MANAGE_PROJECT.id}/manage/members`);
    const text = await page.locator('body').innerText();
    return { inviteLike: (text.match(new RegExp(CONTACT_PATTERN.source, 'g')) ?? []).slice(0, 10) };
  });
}

const TASKS = { T1, T2, T3, T4, T5, T6 };

// ───────────────────────── 실행 ─────────────────────────

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i += 1;
      } else out[key] = true;
    }
  }
  return out;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const summary = { label: LABEL, base: BASE, startedAt: new Date().toISOString(), tasks: {} };
  try {
    for (const [taskId, run] of Object.entries(TASKS)) {
      if (ONLY && !ONLY.has(taskId)) continue;
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ko-KR' });
      await context.addInitScript(TOAST_OBSERVER);
      context.setDefaultTimeout(15000);
      const page = await context.newPage();
      const rec = new Recorder(page, taskId);
      await rec.init();
      try {
        await run(page, rec);
      } catch (error) {
        console.error(`[${taskId}] 과업 중단: ${error?.message ?? error}`);
        rec.steps.push({ step: rec.steps.length + 1, intent: '(하네스 오류)', action: 'task aborted', url: page.url(), screenshot: null, visibleText: '', uiState: {}, ok: false, error: String(error?.message ?? error) });
      }
      await rec.save();
      summary.tasks[taskId] = {
        steps: rec.steps.length,
        failed: rec.steps.filter((s) => !s.ok).map((s) => ({ step: s.step, action: s.action, error: s.error })),
      };
      await context.close();
    }
  } finally {
    await browser.close();
  }
  summary.finishedAt = new Date().toISOString();
  await fs.mkdir(path.join(OUT, LABEL), { recursive: true });
  await fs.writeFile(path.join(OUT, LABEL, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.tasks, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
