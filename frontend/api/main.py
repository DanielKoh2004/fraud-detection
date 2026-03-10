"""
FastAPI proxy for Groq LLM intervention script generation.
Embeds core groq_client logic directly to avoid import dependencies.
"""
import os
import math
import re
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from functools import lru_cache

# Load .env from project root
from dotenv import load_dotenv
BASE_DIR = Path(__file__).parent.parent.parent
load_dotenv(BASE_DIR / ".env")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
    print("✓ Groq library loaded")
except ImportError:
    GROQ_AVAILABLE = False
    Groq = None
    print("⚠ Groq library not installed")

app = FastAPI(
    title="Wutong Defense LLM API",
    description="Proxy API for Groq-based intervention script generation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== PROMPTS ==============

SYSTEM_PROMPT = """You are an Anti-Fraud Intervention Specialist. Write a CONCISE phone script (MAX 200 words) for each student.

=== ABSOLUTE RULES ===
1. STRICT 200 WORD LIMIT - be direct and concise.
2. ONLY use the SPECIFIC_ACTIONS provided - no generic advice.
3. Reference SPECIFIC numbers from their profile.

=== SCRIPT STRUCTURE (Keep it short) ===
OPENING (1 sentence): State their EXACT risk with specific numbers.
DANGER (1 sentence): What happens if they don't act.
ACTIONS (2 bullet points): Use ONLY the SPECIFIC_ACTIONS provided.
CLOSING (1 sentence): One specific next step.

=== FORBIDDEN PHRASES ===
- "Download the Scameter app"
- "Call 18222 hotline"
- "Report to police"
- "Stay vigilant" / "Be careful"
- Generic safety tips

Output: Concise script only. MAX 200 words. Every word must count."""

USER_PROMPT_TEMPLATE = """=== STUDENT PROFILE ===
Risk Tier: {risk_tier} | Score: {risk_score}/100 | Age: {age}

=== PRIMARY SCENARIO: {scenario_name} ===
{scenario_description}

=== TOP RISK SIGNALS ===
{top_risk_signals}

=== SPECIFIC_ACTIONS (USE ONLY THESE) ===
{specific_actions}

=== DATA POINTS ===
- Behavior Score: {behavior_score}/100
- Exposure Score: {exposure_score}/100
- Identity Score: {identity_score}/100

Write a CONCISE intervention script (MAX 200 words) using ONLY the SPECIFIC_ACTIONS above."""

# ============== HELPERS ==============

def _as_int(value, default=0):
    try:
        parsed = float(value) if value else 0
        if math.isnan(parsed):
            return default
        return int(parsed)
    except (TypeError, ValueError):
        return default

def _determine_primary_scenario(profile):
    """Determine the PRIMARY risk scenario for this student."""
    reasons = str(profile.get('risk_reason', '')).lower()
    behavior_score = _as_int(profile.get('behavior_score', 0))
    exposure_score = _as_int(profile.get('exposure_score', 0))
    fraud_flag = str(profile.get('fraud_msisdn_present', '')).strip().lower() in ('true', '1', 'yes')
    
    if fraud_flag or 'confirmed fraud' in reasons or 'blacklist' in reasons:
        return ("CONFIRMED_FRAUD_CONTACT", 
                "Student has had DIRECT CONTACT with a CONFIRMED fraud number.")
    
    if 'called back' in reasons or 'answered suspected' in reasons or behavior_score >= 70:
        return ("ACTIVE_ENGAGEMENT",
                "Student has ACTIVELY ENGAGED with potential fraudsters.")
    
    if 'mainland' in reasons or 'cross-border' in reasons:
        return ("CROSS_BORDER_RISK",
                "Student shows significant CROSS-BORDER call patterns common in impersonation scams.")
    
    if exposure_score >= 60 or 'overseas unknown calls' in reasons:
        return ("HIGH_EXPOSURE",
                f"Student has HIGH EXPOSURE to suspicious numbers (Score: {exposure_score}/100).")
    
    return ("GENERAL_VULNERABILITY",
            "Student shows elevated risk signals that require preventive intervention.")

def _build_scenario_actions(profile, scenario_name):
    """Generate dynamic actions based on risk factors."""
    behavior_score = _as_int(profile.get('behavior_score', 0))
    exposure_score = _as_int(profile.get('exposure_score', 0))
    identity_score = _as_int(profile.get('identity_score', 0))
    reasons_text = str(profile.get('risk_reason', '')).lower()
    
    solutions = []
    
    if scenario_name == "CONFIRMED_FRAUD_CONTACT":
        solutions.append("Block the fraud number immediately and keep call logs as evidence.")
        solutions.append("If any details were shared, change passwords and alert your bank.")
        if behavior_score >= 50:
            solutions.append("Check your bank app RIGHT NOW for unauthorized transactions.")
    
    elif scenario_name == "ACTIVE_ENGAGEMENT":
        solutions.append("STOP all contact immediately - do not answer, call back, or reply.")
        if 'called back' in reasons_text:
            solutions.append("Enable 'Silence Unknown Callers' in your phone settings.")
        solutions.append("If asked to keep anything 'secret', tell a trusted person TODAY.")
    
    elif scenario_name == "CROSS_BORDER_RISK":
        solutions.append("Real police/customs NEVER demand money over the phone - this is a scam.")
        solutions.append("Hang up and verify claims through official government hotlines only.")
        solutions.append("Never use phone numbers a caller gives you to 'verify'.")
    
    elif scenario_name == "HIGH_EXPOSURE":
        solutions.append("Your number is being targeted - continue ignoring unknown callers.")
        solutions.append("Enable call screening: Settings > Phone > Silence Unknown Callers.")
        solutions.append("Every unanswered scam call is a win - keep your guard up.")
    
    else:
        solutions.append("Review recent calls/messages for anything creating urgency or demanding secrecy.")
        solutions.append("Real organizations never ask for money or passwords over unsolicited calls.")
        if identity_score >= 50:
            solutions.append("As a student, be cautious of 'too good to be true' job or investment offers.")
    
    return solutions[:4]

@lru_cache(maxsize=1)
def get_groq_client():
    """Initialize Groq client with caching."""
    if not GROQ_AVAILABLE or not GROQ_API_KEY:
        return None
    return Groq(api_key=GROQ_API_KEY)

def generate_intervention_script(student_profile: dict) -> str:
    """Generate a PERSONALIZED intervention script for a high-risk student."""
    client = get_groq_client()
    
    if client is None:
        if not GROQ_AVAILABLE:
            return "⚠️ Groq library not installed. Run: pip install groq"
        return "⚠️ GROQ_API_KEY not configured. Set it in your .env file."
    
    scenario_name, scenario_description = _determine_primary_scenario(student_profile)
    specific_actions = _build_scenario_actions(student_profile, scenario_name)
    actions_block = "\n".join(f"{i+1}. {action}" for i, action in enumerate(specific_actions))
    
    user_prompt = USER_PROMPT_TEMPLATE.format(
        risk_tier=student_profile.get('risk_tier', 'UNKNOWN'),
        risk_score=_as_int(student_profile.get('risk_score', 50)),
        age=student_profile.get('age', 21),
        scenario_name=scenario_name,
        scenario_description=scenario_description,
        top_risk_signals=student_profile.get('risk_reason', 'No specific signals'),
        specific_actions=actions_block,
        exposure_score=_as_int(student_profile.get('exposure_score', 0)),
        behavior_score=_as_int(student_profile.get('behavior_score', 0)),
        identity_score=_as_int(student_profile.get('identity_score', 0)),
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=400,
            top_p=0.9,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"⚠️ Error generating script: {str(e)}"

# ============== API MODELS ==============

class StudentProfile(BaseModel):
    risk_tier: Optional[str] = "UNKNOWN"
    risk_score: Optional[float] = 50
    age: Optional[int] = 21
    identity_score: Optional[float] = 0
    exposure_score: Optional[float] = 0
    behavior_score: Optional[float] = 0
    risk_reason: Optional[str] = ""
    
    class Config:
        extra = "ignore"

class InterventionResponse(BaseModel):
    script: str
    success: bool
    error: Optional[str] = None

# ============== ENDPOINTS ==============

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Wutong Defense LLM API",
        "groq_available": GROQ_AVAILABLE,
        "api_key_set": bool(GROQ_API_KEY)
    }

@app.post("/api/intervention", response_model=InterventionResponse)
async def generate_intervention(profile: StudentProfile):
    """Generate personalized intervention script using Groq LLM."""
    try:
        script = generate_intervention_script(profile.model_dump())
        
        if script.startswith("⚠️"):
            return InterventionResponse(script=script, success=False, error="LLM generation failed")
        
        return InterventionResponse(script=script, success=True)
    except Exception as e:
        return InterventionResponse(script=f"Error: {str(e)}", success=False, error=str(e))


# ============== NETWORK DATA ENDPOINT ==============

import pandas as pd

# Data paths - check multiple possible locations
STUDENT_MODEL_PATH = BASE_DIR / "Datasets" / "Student" / "Training and Testing Data" / "student_model.csv"
STUDENT_PREDICTIONS_PATH = BASE_DIR / "output" / "student_predictions.csv"

def load_network_data():
    """Load real fraud-student network from CSV files."""
    try:
        # Try student_model.csv first (has fraud_msisdn column)
        if STUDENT_MODEL_PATH.exists():
            print(f"Loading network from: {STUDENT_MODEL_PATH}")
            df = pd.read_csv(STUDENT_MODEL_PATH, low_memory=False)
        elif STUDENT_PREDICTIONS_PATH.exists():
            print(f"Loading network from: {STUDENT_PREDICTIONS_PATH}")
            df = pd.read_csv(STUDENT_PREDICTIONS_PATH, low_memory=False)
        else:
            print("No student data file found")
            return None
        
        # Filter to students with fraud_msisdn (actually contacted by fraud)
        if 'fraud_msisdn' not in df.columns:
            print("fraud_msisdn column not found")
            return None
            
        network_df = df[df['fraud_msisdn'].notna()].copy()
        print(f"Found {len(network_df)} fraud-student connections")
        
        if len(network_df) == 0:
            return None
            
        return network_df
    except Exception as e:
        print(f"Error loading network data: {e}")
        return None


@app.get("/api/network")
async def get_network_data():
    """Return fraud-student network data for visualization."""
    df = load_network_data()
    
    if df is None:
        # Return empty data
        return {
            "nodes": [],
            "edges": [],
            "stats": {
                "totalFraudNumbers": 0,
                "totalStudents": 0,
                "oneToManyHunters": 0,
                "maxTargets": 0
            }
        }
    
    # Build nodes and edges
    nodes = []
    edges = []
    fraud_nodes_set = set()
    student_nodes_set = set()
    
    # Count targets per fraud number
    fraud_target_counts = df['fraud_msisdn'].value_counts().to_dict()
    
    for idx, row in df.iterrows():
        fraud_msisdn = str(row['fraud_msisdn'])
        user_id = str(row.get('user_id', f'user_{idx}'))
        
        # Skip invalid
        if pd.isna(row['fraud_msisdn']) or fraud_msisdn in ('', 'nan', 'None'):
            continue
        
        # Create fraud node
        fraud_id = f"F-{fraud_msisdn[-6:]}"
        if fraud_id not in fraud_nodes_set:
            fraud_nodes_set.add(fraud_id)
            nodes.append({
                "id": fraud_id,
                "type": "fraud",
                "label": f"{fraud_msisdn[:4]}****{fraud_msisdn[-4:]}" if len(fraud_msisdn) > 8 else fraud_msisdn,
                "targetCount": fraud_target_counts.get(row['fraud_msisdn'], 1)
            })
        
        # Create student node
        student_id = f"S-{user_id[-6:]}" if len(user_id) > 6 else f"S-{user_id}"
        if student_id not in student_nodes_set:
            student_nodes_set.add(student_id)
            risk_tier = str(row.get('risk_tier', 'SAFE')).upper()
            if risk_tier not in ('CRITICAL', 'VULNERABLE', 'SAFE'):
                risk_tier = 'SAFE'
            nodes.append({
                "id": student_id,
                "type": "student",
                "label": student_id,
                "riskTier": risk_tier,
                "riskScore": int(row.get('risk_score', 0)) if pd.notna(row.get('risk_score')) else 0
            })
        
        # Create edge
        edges.append({
            "source": fraud_id,
            "target": student_id,
            "weight": 1
        })
    
    # Calculate stats
    stats = {
        "totalFraudNumbers": len(fraud_nodes_set),
        "totalStudents": len(student_nodes_set),
        "oneToManyHunters": sum(1 for c in fraud_target_counts.values() if c >= 3),
        "maxTargets": max(fraud_target_counts.values()) if fraud_target_counts else 0
    }
    
    # Limit for performance (max 200 nodes total)
    if len(nodes) > 200:
        # Prioritize high-target fraud numbers
        top_frauds = sorted(fraud_target_counts.items(), key=lambda x: x[1], reverse=True)[:30]
        top_fraud_ids = {f"F-{str(f)[-6:]}" for f, _ in top_frauds}
        
        nodes = [n for n in nodes if n['type'] == 'fraud' and n['id'] in top_fraud_ids or 
                 n['type'] == 'student'][:200]
        valid_ids = {n['id'] for n in nodes}
        edges = [e for e in edges if e['source'] in valid_ids and e['target'] in valid_ids][:300]
    
    return {
        "nodes": nodes,
        "edges": edges,
        "stats": stats
    }


if __name__ == "__main__":
    import uvicorn
    print(f"Starting Wutong Defense LLM API on http://localhost:8000")
    print(f"GROQ_API_KEY set: {bool(GROQ_API_KEY)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)

