# 3.5 Black Sample Data Identification and Collection Scheme

## 3.5.1 Overview

The black sample identification and collection scheme is designed to automatically generate high-quality training data for fraud detection models without relying on external blacklists that expire within 24-48 hours. Our system implements a self-sustaining pipeline that continuously identifies, verifies, and expands the pool of confirmed fraud samples while maintaining user privacy and regulatory compliance.

## 3.5.2 Design Principles

The scheme is built on three core principles:

First, we prioritize precision over recall in initial identification. High-confidence rules with near-zero false positive rates form the seed set, ensuring training data quality.

Second, we implement progressive expansion through behavioral pattern matching. Machine learning models identify "look-alike" numbers that exhibit similar behavioral signatures to confirmed fraud.

Third, we incorporate human-in-the-loop verification for uncertain cases. Grey-tier samples require administrative review before promotion to the training set, preventing model drift from mislabeled data.

## 3.5.3 Three-Stage Purification Funnel

### Stage 1: Rule Engine Detection

The 7-Rule Engine applies deterministic behavioral thresholds to identify obvious fraud patterns:

R1 SIM Box: Numbers with dispersion rate below 0.04 and call count exceeding 50 per day indicate commercial-grade fraud infrastructure calling many unique numbers with similar patterns.

R2 Wangiri: Numbers with zero incoming calls and more than 50 outgoing calls exhibit the classic one-ring-and-cut pattern designed to prompt expensive callbacks.

R3 Prepaid Burner: Prepaid accounts less than 7 days old with more than 10 calls per day suggest disposable SIMs activated specifically for fraud campaigns.

R4 Student Hunter: Numbers contacting more than 5 students or more than 3 unique student numbers indicate targeted campus fraud operations.

R5 Device Hopper: Numbers changing IMEI more than once in the observation period suggest SIM swapping to evade detection.

R6 Smishing Bot: Numbers sending more than 50 SMS messages with zero voice calls indicate mass text fraud operations.

R7 Short Burst: Numbers with average call duration under 15 seconds and more than 30 calls exhibit robocall patterns.

These rules use adaptive thresholds calibrated to the dataset to prevent false positives during high-traffic periods.

### Stage 2: Machine Learning Expansion

The XGBoost classifier and Isolation Forest work in ensemble to expand detection beyond predefined rules:

XGBoost is trained on confirmed fraud samples from Stage 1 and historical audit data. It learns complex feature interactions such as the combination of low dispersion, prepaid status, and high overseas call volume that individually might not trigger rules.

Isolation Forest operates unsupervised to identify statistical anomalies in the behavioral feature space. Numbers that deviate significantly from normal usage patterns are flagged regardless of whether they match known fraud signatures.

The ML layer produces probability scores. High-confidence predictions above 85% are directly added to the blacklist. Predictions between 60% and 85% are routed to the greylist for human review.

### Stage 3: Feedback Verification

The greylist serves as a verification buffer:

Administrative Review: Dashboard operators can investigate grey-tier numbers, viewing their call patterns, student reach, and rule near-misses. Confirmed fraud is promoted to the blacklist; verified legitimate numbers are added to the whitelist.

Audit Integration: When CMHK's internal audit team rejects an account, that number is automatically added to the Gold Set of confirmed fraud samples.

Student Reports: When students report suspicious calls through the mobile app, reported numbers are flagged for priority review.

Verified samples form the Gold Set, which is used to retrain the XGBoost model on a daily schedule.

## 3.5.4 Continuous Update Mechanism

The scheme implements an active learning loop that ensures the model remains current against evolving fraud tactics:

Daily Retraining: Each night, the XGBoost model is retrained on the expanded dataset that includes newly verified Gold Set entries and hard negatives from false positive analysis.

Threshold Adaptation: Rule thresholds are recalibrated weekly based on network traffic patterns to maintain consistent false positive rates across varying load conditions.

Feature Drift Monitoring: Statistical tests detect when feature distributions shift significantly, triggering alert for potential fraud tactic evolution.

## 3.5.5 Privacy and Compliance

All processing maintains compliance with Hong Kong's Personal Data Privacy Ordinance:

Differential Privacy: Aggregate statistics use the Laplace mechanism with epsilon equals 0.5, ensuring that any individual's presence or absence in the dataset changes output probabilities by at most 65%.

PII Masking: Phone numbers are masked to format 8529XXXX123 before display. User IDs are anonymized in logs and reports.

Data Minimization: Only behavioral aggregates are retained for model training. Raw call detail records are purged after feature extraction.

Purpose Limitation: Black sample data is used exclusively for fraud detection model training and is not shared with external parties.

## 3.5.6 Results

The scheme achieved the following metrics:

Rule Engine Seed Samples: 4,431 numbers identified through high-confidence rules
ML Expansion: 7,839 additional numbers identified through behavioral analysis  
Total Blacklist: 12,270 confirmed fraud numbers
Greylist for Review: 893 suspicious numbers pending verification
Model AUC: 0.89 on held-out test set

The self-generating pipeline produces approximately 200-500 new verified samples per week, eliminating dependency on external blacklists while maintaining data quality for model iteration.
