import tempfile
import subprocess
import pickle
import os
import sys

def execute_code_sandboxed(code: str, dfs: dict) -> dict:
    with tempfile.TemporaryDirectory() as tmpdir:
        data_path = os.path.join(tmpdir, 'data.pkl')
        with open(data_path, 'wb') as f:
            pickle.dump(dfs, f)
            
        runner_code = f"""import pickle
import pandas as pd
import sys

with open('data.pkl', 'rb') as f:
    dfs = pickle.load(f)
locals().update(dfs)

try:
{chr(10).join('    ' + line for line in code.split(chr(10)))}
except Exception as e:
    print(f"ERROR: {{e}}", file=sys.stderr)
"""
        runner_path = os.path.join(tmpdir, 'runner.py')
        with open(runner_path, 'w', encoding='utf-8') as f:
            f.write(runner_code)
            
        try:
            result = subprocess.run(
                [sys.executable, 'runner.py'],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=10
            )
            return {
                "stdout": result.stdout,
                "error": result.stderr if result.returncode != 0 else ""
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "error": "Execution timed out after 10 seconds."
            }
