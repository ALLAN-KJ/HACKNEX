import os
import json
import pandas as pd
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from scanner import scan_dataframe, detect_currency_conflict
from executor import execute_code_sandboxed

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are a data analyst. You are provided with a summary of pandas DataFrames and a user question.
You must return ONLY a JSON object with this exact schema:
{
  "answer": "A short markdown answer based on the data.",
  "confidence": "High" | "Medium" | "Low",
  "refuse_reason": "If the question is completely unrelated or impossible, explain why. Otherwise null.",
  "code": "Python code using pandas to compute the answer. The dataframes are available as variables matching their filenames (without extension). Use print() to output the final scalar or short string.",
  "caveats": ["List of data quality issues or assumptions made."]
}
"""

@app.post("/api/analyze")
async def analyze(files: List[UploadFile], question: str = Form(...)):
    dfs = {}
    scans = []
    
    for file in files:
        df = pd.read_csv(file.file)
        name = file.filename.split('.')[0]
        dfs[name] = df
        
        scan = scan_dataframe(df, file.filename)
        scan['df'] = df
        scans.append(scan)
        
    conflicts = detect_currency_conflict(scans)
    
    summary = {
        "files": [{k: v for k, v in s.items() if k != 'df'} for s in scans],
        "conflicts": conflicts,
        "question": question
    }
    
    user_msg = json.dumps(summary)
    
    from groq import Groq
    client = Groq(api_key=os.environ.get("GROQ_API_KEY", "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"))
    
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg}
        ],
        response_format={"type": "json_object"}
    )
    raw_text = response.choices[0].message.content
    
    
    try:
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
        result = json.loads(raw_text)
    except Exception as e:
        return {"error": "Failed to parse model response", "raw": raw_text}
        
    if result.get("refuse_reason"):
        return result
        
    exec_result = execute_code_sandboxed(result["code"], dfs)
    stdout = exec_result.get("stdout", "").strip()
    
    if exec_result.get("error"):
        result["caveats"].append(f"Execution error: {exec_result['error']}")
        result["confidence"] = "Low"
    elif stdout:
        lower_ans = result.get("answer", "").lower()
        if any(phrase in lower_ans for phrase in ["unable to determine", "summary alone", "cannot determine", "don't have", "do not have"]):
            result["answer"] = stdout
            if result.get("confidence") == "Low" and not exec_result.get("error"):
                result["confidence"] = "High" if not result.get("caveats") else "Medium"
        
        import re
        ans_nums = re.findall(r"[-+]?\d*\.\d+|\d+", result["answer"].replace(",", ""))
        out_nums = re.findall(r"[-+]?\d*\.\d+|\d+", stdout.replace(",", ""))
        if ans_nums and out_nums:
            try:
                ans_val = float(ans_nums[0])
                out_val = float(out_nums[0])
                if out_val != 0 and abs(ans_val - out_val) / abs(out_val) > 0.01:
                    result["confidence"] = "Low"
                    result["caveats"].append("Mismatch between model answer and executed code output.")
            except:
                pass

    result["stdout"] = stdout
    return result
