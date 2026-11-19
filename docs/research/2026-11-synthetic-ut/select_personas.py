"""Pick 20 meeTeam-fit personas from Nemotron-Personas-Korea (Desktop copy)."""
import json, re, sys
import pyarrow.parquet as pq, pyarrow.compute as pc

P = "/Users/yeonjun/Desktop/nemotron-personas-dataset-ko_kr_v0.0.1/ko_KR.parquet"
OUT = sys.argv[1]
TEXT = ["skills_and_expertise", "career_goals_and_ambitions", "hobbies_and_interests", "professional_persona", "detailed_persona"]
COLS = ["uuid", "first_name", "last_name", "sex", "age", "region", "district", "education_level", "bachelors_field",
        "occupation", "economic_activity_status", "military_status", "openness", "conscientiousness", "extraversion",
        "agreeableness", "neuroticism", "cultural_background", "persona", "hobbies_and_interests_list", "skills_and_expertise_list"] + TEXT

t = pq.read_table(P, columns=COLS, filters=[("age", ">=", 19), ("age", "<=", 26),
                                            ("education_level", "in", ["4년제 대학교"]),
                                            ("occupation", "=", "무직"),
                                            ("region", "in", ["서울", "경기", "인천"])])
rows = t.to_pylist()
print("pool", len(rows))

# target segment -> (eligible majors, segment keywords)
SEGMENTS = {
    "개발(FE/BE)": (["정보통신기술", "공학·제조·건설", "자연과학·수학"], r"코딩|프로그래밍|개발|앱|웹|알고리즘|파이썬|자바|소프트웨어|서버|데이터|해커톤|깃허브|AI|인공지능"),
    "디자인": (["예술·인문"], r"디자인|UI|UX|피그마|일러스트|포토샵|영상|브랜딩|시각|그래픽"),
    "기획/PM": (["경영·행정·법", "사회과학·언론"], r"기획|창업|스타트업|서비스|리서치|분석|PM|프로젝트 관리|전략|아이디어"),
    "마케팅": (["경영·행정·법", "사회과학·언론", "예술·인문"], r"마케팅|SNS|콘텐츠|홍보|광고|브랜드|인스타그램|유튜브"),
    "비전공 협업자": (["교육", "보건·복지", "서비스", "자연과학·수학", "사회과학·언론"], r"공모전|동아리|봉사|프로젝트|대외활동|연구|발표"),
}
TEAM = r"팀|협업|동아리|공모전|프로젝트|캡스톤|대외활동|스터디|해커톤|조별|발표"
QUOTA = {"개발(FE/BE)": 7, "디자인": 4, "기획/PM": 4, "마케팅": 2, "비전공 협업자": 3}

def blob(r): return " ".join(r[c] or "" for c in TEXT)
def t_score(r, k): return json.loads(r[k])["t_score"]

picked, used = [], set()
for seg, (majors, kw) in SEGMENTS.items():
    cands = []
    for r in rows:
        if r["uuid"] in used or r["bachelors_field"] not in majors: continue
        b = blob(r)
        seg_hits, team_hits = len(re.findall(kw, b)), len(re.findall(TEAM, b))
        if seg_hits == 0 or team_hits == 0: continue
        cands.append((seg_hits * 2 + team_hits, r))
    cands.sort(key=lambda x: -x[0])
    # within the top band, spread personality (extraversion) and sex so the panel isn't one voice
    band, chosen = [r for _, r in cands[:60]], []
    want_sex = ["여자", "남자"]
    for r in sorted(band, key=lambda r: abs(t_score(r, "extraversion") - 50), reverse=True):
        if len(chosen) == QUOTA[seg]: break
        ext = t_score(r, "extraversion") >= 50
        if sum(1 for c in chosen if c["sex"] == r["sex"]) > QUOTA[seg] // 2: continue
        if sum(1 for c in chosen if (t_score(c, "extraversion") >= 50) == ext) > QUOTA[seg] // 2: continue
        chosen.append(r)
    for r in band:  # top up if balancing was too strict
        if len(chosen) == QUOTA[seg]: break
        if r not in chosen: chosen.append(r)
    for r in chosen:
        used.add(r["uuid"])
        picked.append({"segment": seg, "candidates_in_segment": len(cands), **r})

for i, p in enumerate(picked, 1):
    p["pid"] = f"P{i:02d}"
json.dump(picked, open(OUT, "w"), ensure_ascii=False, indent=1)
for p in picked:
    print(p["pid"], p["segment"], p["last_name"] + p["first_name"], p["sex"], p["age"], p["district"], p["bachelors_field"],
          "E", t_score(p, "extraversion"), "C", t_score(p, "conscientiousness"), "|", p["persona"][:70])
