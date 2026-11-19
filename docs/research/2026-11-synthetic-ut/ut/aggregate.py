"""Aggregate UT result JSONs: python ut/aggregate.py baseline [after]"""
import json, glob, sys, collections

TASK_HYP = {"T1": ["H-U1", "H-U2"], "T2": ["H-U8"], "T3": ["H-U3", "H-U4"], "T4": ["H-U5"], "T5": ["H-U6"], "T6": ["H-U7"]}

def load(label):
    return [json.load(open(f)) for f in sorted(glob.glob(f"ut/{label}/P*.json"))]

def summarize(label):
    rows = load(label)
    tasks, hyps = {}, {}
    for t in TASK_HYP:
        done = [r["tasks"][t] for r in rows if t in r["tasks"]]
        oc = collections.Counter(d["outcome"] for d in done)
        tasks[t] = {"n": len(done), "success": oc["success"], "struggle": oc["struggle"], "fail": oc["fail"],
                    "seq": round(sum(d["seq"] for d in done) / len(done), 2) if done else None}
        for h in TASK_HYP[t]:
            hits = sum(1 for d in done if h in d.get("hit", []))
            hyps[h] = {"task": t, "n": len(done), "hit": hits, "rate": round(hits / len(done), 2) if done else None}
    return {"label": label, "participants": len(rows), "tasks": tasks, "hypotheses": hyps}

def verdict(rate):
    return "지지" if rate >= 0.3 else "부분 지지" if rate >= 0.1 else "기각"

labels = sys.argv[1:] or ["baseline"]
res = {l: summarize(l) for l in labels}
json.dump(res, open(f"ut/aggregate-{'-vs-'.join(labels)}.json", "w"), ensure_ascii=False, indent=1)
for l, s in res.items():
    print(f"## {l} (n={s['participants']})")
    print("task  n  S  St  F  SEQ")
    for t, v in s["tasks"].items():
        print(f"{t}   {v['n']:>2} {v['success']:>2} {v['struggle']:>3} {v['fail']:>2}  {v['seq']}")
    for h, v in s["hypotheses"].items():
        print(f"{h} {v['task']} {v['hit']}/{v['n']} = {v['rate']:.0%} {verdict(v['rate'])}")
