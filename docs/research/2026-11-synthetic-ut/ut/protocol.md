# UT 프로토콜 (baseline과 after에서 똑같이 사용)

> 합성 페르소나를 대상으로 한 인지적 워크스루입니다. 실제 사용자 UT가 아닙니다.

## 입력

- `RUN=/private/tmp/claude-501/-Users-yeonjun-02-Work-02-Projects-meeteam-frontend/3be2b149-7bd5-4158-9c66-ca38310fa136/scratchpad/ut/runs/<label>`
- 각 과업 폴더(`$RUN/T1` … `$RUN/T6`)에 들어 있는 `steps.json`과 스크린샷 PNG. 스크린샷은 Read 도구로 직접 열어서 봅니다. 토스트는 4.2초 뒤에 사라지므로 `uiState.transientMessages`를 함께 확인합니다.
- `../personas.json`: 페르소나 원본
- `../interviews/<PID>.md`, `../interviews/<PID>.json`: 인터뷰 결과(`ut_role` 포함)
- `../hypotheses.md`: 과업과 가설의 대응 관계

## 수행 방식

1. 페르소나 한 명씩, 그 사람으로서 과업을 수행합니다. member는 T1~T3, leader는 T1~T6입니다.
2. 하네스가 지나간 경로에는 실수하는 분기(동의 체크 없이 로그인, 5자 제출 등)가 섞여 있습니다. 단계마다 스크린샷을 보고 판단합니다.
   - 이 페르소나가 이 화면에서 무엇을 보고 무엇을 누를지 정합니다. 화면에 보이는 크기, 대비, 위치, 문구만 근거로 삼고, 코드나 하네스의 의도는 근거로 쓰지 않습니다.
   - 실수 분기에 빠질지는 화면 근거와 성격으로 정합니다. 성실성(C)이 낮거나 신경성(N)이 높으면 더 쉽게 빠지고, C가 높으면 덜 빠집니다. 화면이 실수를 충분히 막고 있다면 빠지지 않는다고 판단합니다. 20명 모두 같은 실수를 하게 만들지 마세요.
   - 빠졌다면 복구 화면에서 무엇을 이해하고 어떻게 다시 시도하는지 적습니다.
3. 목업 데이터끼리 맞지 않는 부분(인원 수, 프로젝트 소속 등)은 시드 데이터 문제이므로 무시하고, 판정에도 넣지 않습니다.
4. 각 과업 결과를 아래 셋 중 하나로 매깁니다.
   - `success`: 혼자 완료함
   - `struggle`: 완료했지만 실수나 망설임을 거침
   - `fail`: 포기했거나, 완료하지 못했거나, 잘못된 결과를 맞다고 믿음
5. 과업마다 SEQ(1~7점, 7이 가장 쉬움)를 매기고, 페르소나 말투로 한두 문장 소감을 씁니다.

## 출력: `ut/<label>/<PID>.json`

```json
{"pid":"P01","label":"baseline","ut_role":"leader",
 "tasks":{"T1":{"outcome":"success|struggle|fail","seq":5,
   "hit":["H-U1"],                       // 실제로 겪은 가설 ID만 적음
   "missed_trap":["H-U2"],               // 화면 근거로 피한 함정
   "critical_step":"03-login-disabled.png",
   "think_aloud":"<페르소나 말투 1~3문장>",
   "evidence":"<무엇을 보고 그렇게 판단했는지: 스크린샷 파일명과 화면 문구>"}, "...": {}},
 "other_issues":["<가설 밖에서 겪은 문제>"],
 "overall_quote":"<한 문장>"}
```

## 집계 규칙

가설별 `hit` 비율을 계산합니다. 분모는 그 과업을 수행한 인원입니다. 판정은 `hypotheses.md`의 기준을 따릅니다.
