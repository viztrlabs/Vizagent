import os, subprocess, glob

base = "."
def exists(p): return os.path.exists(os.path.join(base,p))

print("=== lib/server/admin/ contents ===")
try:
    for root, dirs, files in os.walk("lib/server/admin"):
        for f in files:
            print(os.path.join(root, f))
except Exception as e:
    print("NONE", e)

print("\n=== git status (uncommitted) ===")
r = subprocess.run(["git","status","--porcelain"], capture_output=True, text=True)
print(r.stdout[:2000] if r.stdout else "clean / no git")

print("\n=== git log last 8 ===")
r = subprocess.run(["git","log","--oneline","-8"], capture_output=True, text=True)
print(r.stdout.strip() if r.stdout else "no git")

print("\n=== api route file count ===")
api = glob.glob("app/api/**/*.ts", recursive=True)
print(len(api), "api route files")

print("\n=== refs to Phase1 model names in lib/ ===")
for m in ["SupportTicket","UserNote","JobExecution","DataExportRequest","ImpersonationLog"]:
    hits=[]
    for root,dirs,files in os.walk("lib"):
        for f in files:
            if f.endswith(".ts"):
                p=os.path.join(root,f)
                if m in open(p,encoding="utf-8",errors="ignore").read():
                    hits.append(p)
    print(f"{m}: {len(hits)} refs -> {hits[:3]}")

print("\n=== admin API routes referenced? ===")
refs = []
for p in api:
    t = open(p,encoding="utf-8",errors="ignore").read()
    if "admin" in p or "admin" in t.lower():
        refs.append(p)
print(f"{len(refs)} api files mention admin")

print("\n=== END ===")
