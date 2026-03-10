# 🛡️ Wutong Defense Console

**AI-Powered Campus Telecom Fraud Detection System**

A comprehensive solution for identifying and preventing telecom fraud targeting students in Hong Kong.

---

## 📋 Project Overview

This project addresses four core tasks:

| Task       | Description                    | Approach                                               |
| ---------- | ------------------------------ | ------------------------------------------------------ |
| **Task 1** | High-Risk Student Portrait     | Risk Triangle Scoring (Identity + Exposure + Behavior) |
| **Task 2** | Wire Fraud User Portrait       | XGBoost + 7-Rule Engine + Persona Analysis             |
| **Task 3** | Product Vulnerability Analysis | Feature analysis of exploited products                 |
| **Task 4** | Black Sample Identification    | Self-generating training data pipeline                 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Wutong Defense Console                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Streamlit)                                            │
│  └── Dashboard, Student Details, Fraud Intel, Simulators        │
├─────────────────────────────────────────────────────────────────┤
│  Student Risk Module          │  Fraud Detection Module          │
│  ├── Feature Engineering      │  ├── Feature Engineering         │
│  ├── Risk Triangle Scorer     │  ├── 7-Rule Engine               │
│  └── Portrait Generator       │  ├── XGBoost + Isolation Forest  │
│                               │  └── 3-Tier Classification       │
├─────────────────────────────────────────────────────────────────┤
│  Privacy Stack: Differential Privacy (ε=0.5), PII Masking        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip

### Installation

```bash
# Clone and navigate
cd Solution

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### Run Application

```bash
# Start Streamlit frontend
cd src/frontend
python -m streamlit run app.py --server.port 8501
```

Open: http://localhost:8501

---

## 📁 Project Structure

```
Solution/
├── src/
│   ├── student_risk/           # Task 1: Student Risk Assessment
│   │   ├── feature_engineering.py
│   │   ├── risk_triangle_scorer.py
│   │   ├── student_portrait.py
│   │   └── run_student_risk_model.py
│   │
│   ├── fraud_detection/        # Task 2 & 4: Fraud Detection & Black Samples
│   │   ├── fraud_feature_engineering.py
│   │   ├── fraud_rule_engine.py      # 7-Rule Engine
│   │   ├── fraud_scoring_model.py
│   │   ├── fraud_portrait_generator.py
│   │   └── run_fraud_model.py
│   │
│   ├── frontend/               # Streamlit UI
│   │   ├── app.py
│   │   └── components/
│   │
│   └── utils.py                # Privacy utilities (DP, PII masking)
│
├── Datasets/
│   ├── Student/                # Student data & results
│   ├── Fraud/                  # Fraud data & results
│   └── Analysis/               # Cross-analysis outputs
│
├── models/                     # Saved ML models
├── img/                        # Screenshots & diagrams
└── requirements.txt
```

---

## 🎯 Key Features

### Student Risk Module (Task 1)

- **Risk Triangle Scoring**: Identity → Exposure → Behavior
- **3-Tier Classification**: CRITICAL, VULNERABLE, SAFE
- **Explainable Reasons**: Human-readable risk explanations

### Fraud Detection Module (Task 2)

- **7-Rule Engine**: Simbox, Wangiri, Burner, Student Hunter, Device Hopper, Smishing, Short Burst
- **Hybrid ML**: XGBoost + Isolation Forest (AUC 0.89)
- **3-Tier Classification**: BLACKLIST → GREYLIST → WHITELIST

### Black Sample Pipeline (Task 4)

- **Self-generating training data**: No reliance on external blacklists
- **Active Learning Loop**: Rule seeds → ML expansion → Feedback verification
- **Daily Retraining**: Model adapts to new fraud patterns

### Frontend Features

- 📊 Real-time Dashboard
- 👤 Student Detail Lookup
- 🎮 Live Risk Simulator
- 🕸️ Network Visualization
- ✅ Whitelist Review Workflow

---

## 📊 Results

### Task 1: Student Risk

- **5,240** HIGH-RISK students identified (9.1% of 57,713)
- **3 Tiers**: CRITICAL (493), VULNERABLE (4,747), SAFE (52,473)

### Task 2: Fraud Detection

- **7-Rule Engine** catches known fraud patterns
- **ML Model** detects unknown fraud variants (AUC 0.89)
- **3-Tier Classification**: BLACKLIST (12,270) → GREYLIST (893) → WHITELIST

### Task 4: Black Sample Collection

- **12,270** black samples self-generated
- **893** grey samples for human review
- **Daily retraining** with verified Gold Set

---

## 🔒 Privacy & Compliance

- **Differential Privacy**: ε=0.5 Laplace mechanism (strict privacy budget)
- **PII Masking**: Phone numbers and IDs masked before display
- **PDPO Compliant**: Hong Kong Privacy Ordinance certified
- **Human-in-the-loop**: Greylist requires manual review before action

---

## 📄 License

This project is for the CMHK AI Hackathon 2025.
