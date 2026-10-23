import { afterEach, describe, expect, it } from 'vitest';
import { useToastStore } from '@/stores/useToastStore';

afterEach(() => useToastStore.setState({ messages: [] }));

describe('toast state boundaries', () => {
  it('메시지 ID와 기본 지속시간·오류 톤을 설정한다', () => {
    const id = useToastStore.getState().showToast({ message: '확인' });
    expect(useToastStore.getState().messages).toEqual([
      { id, message: '확인', tone: 'error', durationMs: 4200 },
    ]);
  });
  it('화면을 가리지 않도록 최근 세 개만 유지한다', () => {
    for (let index = 0; index < 5; index++)
      useToastStore.getState().showToast({ message: String(index) });
    expect(useToastStore.getState().messages.map((message) => message.message)).toEqual([
      '2',
      '3',
      '4',
    ]);
  });
  it('지정 ID만 닫고 다른 작업의 안내는 보존한다', () => {
    const first = useToastStore
      .getState()
      .showToast({ message: '첫 작업', tone: 'success', durationMs: 1000 });
    const second = useToastStore.getState().showToast({ message: '둘째 작업', tone: 'info' });
    useToastStore.getState().dismissToast(first);
    expect(useToastStore.getState().messages.map((message) => message.id)).toEqual([second]);
  });
  it('이미 닫힌 ID를 다시 닫아도 남은 메시지를 제거하지 않는다', () => {
    const id = useToastStore.getState().showToast({ message: '유지할 메시지' });
    useToastStore.getState().dismissToast('unknown');
    expect(useToastStore.getState().messages[0].id).toBe(id);
  });
});
