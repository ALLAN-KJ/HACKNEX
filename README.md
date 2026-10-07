# ProofAnalyst

## What it does
ProofAnalyst is an AI-powered data quality scanner and analytical sandbox. It allows users to drag and drop CSV datasets and ask complex analytical questions. It performs an upfront data quality scan, builds a data summary, and uses an LLM to generate pandas execution code to securely answer the query while flagging data quality issues or conflicts (like mismatched currencies).

## Data Pipeline
```
[Upload CSVs] → [Scanner (Duplicates/Nulls/Currencies)] → [Gemini 2.0 Flash] → [Sandbox Execution] → [Verification] → [Result & Caveats]
```

## Core Model / Reasoning
The system uses `gemini-2.0-flash` with a strict JSON schema for reasoning. The model generates both the direct answer and the `pandas` code necessary to compute it. It employs refusal logic for impossible or unrelated queries (like requesting non-existent data) and uses sandbox verification to execute the generated code in a secure environment. The output of the sandbox is cross-referenced with the model's answer; if they diverge, the confidence is downgraded and caveats are surfaced.

## Technologies
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI, `uvicorn`, `python-multipart`
- **AI/LLM**: `google-generativeai` (Gemini 2.0 Flash)
- **Data Processing**: `pandas`, `numpy`

## Install Instructions
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
pip install fastapi uvicorn python-multipart google-generativeai pandas numpy
```

**Frontend:**
```bash
cd frontend
npm install
```

## Run Instructions
Run these in two separate terminals:
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Sample Input & Output
- **Question 1**: "What is the total revenue across all sales?" (Provided USD and EUR files)
  - *Expected*: Refused or flagged with caveats because currencies are mixed and cannot be directly summed without conversion.
- **Question 2**: "Which product appears most frequently in inventory?"
  - *Expected*: Answers correctly and identifies duplicate rows as a caveat if relevant.
- **Question 3**: "What is the average price of in-stock items?"
  - *Expected*: Computes the average correctly, but caveats that null values exist in the `unit_price` column.

## Evidence & Explanation
The application assigns a confidence score (High, Medium, Low) to each answer. This score is determined by verifying the sandbox execution stdout against the LLM's generated markdown answer. If the code output diverges by more than a margin of error, or if severe data issues are detected, the confidence drops. All identified data quality issues and execution errors are listed as caveats.

## Scope Note
This is an MVP (Minimum Viable Product). It covers basic CSV uploading, schema scanning, strict JSON model output, sandboxed pandas execution, and result verification. Stretch goals not implemented include:
- Advanced sandbox security (e.g., Docker, AppArmor).
- Support for complex multi-table joins requiring LLM schema exploration.
- Rich charting and interactive data visualizations.

## How to Reproduce
Run the following commands:
```bash
curl -s -X POST http://localhost:8000/api/analyze \
  -F "files=@sample_data/sales_usd.csv" \
  -F "files=@sample_data/sales_eur.csv" \
  -F "question=What is the total revenue across all sales?" \
  | python -m json.tool > sample_outputs/refused_response.json

curl -s -X POST http://localhost:8000/api/analyze \
  -F "files=@sample_data/inventory.csv" \
  -F "question=Which product appears most frequently in inventory?" \
  | python -m json.tool > sample_outputs/inventory_answer.json

curl -s -X POST http://localhost:8000/api/analyze \
  -F "files=@sample_data/inventory.csv" \
  -F "question=What is the average price of in-stock items?" \
  | python -m json.tool > sample_outputs/null_caveat_answer.json
```

## Declared Resources
- Gemini API (gemini-2.0-flash)
- Google Fonts (Inter, JetBrains Mono)
- No other models or external services are used.
