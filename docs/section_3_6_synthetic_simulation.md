# 3.6 Synthetic Data Simulation for Model Training

## 3.6.1 Overview

The synthetic data simulation module addresses a critical challenge in fraud detection: the inability to test models against real fraud attacks due to ethical and legal constraints. By generating synthetic fraud patterns using generative AI models, we can stress-test the detection system against unseen attack vectors and augment training data for rare fraud types.

## 3.6.2 Motivation

Real fraud data has inherent limitations for model development. Fraud samples are rare, representing less than 1% of total records in most datasets. Certain attack types may have few or no historical examples. Testing against live fraud attacks poses risk to actual users. Regulatory constraints limit data sharing across jurisdictions.

Synthetic simulation addresses these gaps by generating statistically realistic fraud patterns that preserve the distributional properties of real data without containing actual user information.

## 3.6.3 Generative Model Architecture

We employ a generative model specifically designed for tabular data with mixed continuous and categorical columns.

The Generator network learns to produce synthetic records that match the statistical distribution of the training data. Given a random noise vector and conditional labels (fraud or non-fraud), it outputs realistic feature values for call count, duration, dispersion rate, and other behavioral metrics.

The Discriminator network learns to distinguish between real and synthetic records. Through adversarial training, the generator improves until synthetic records are statistically indistinguishable from real data.

Mode-specific Normalization handles the multimodal distributions common in telecom data, such as call duration which exhibits peaks at 0 seconds (unanswered), 30 seconds (voicemail), and variable durations for completed calls.

## 3.6.4 Training Process

The generative model is trained on the confirmed fraud samples from the blacklist:

Data Preparation: Fraud samples are extracted and features are normalized. Categorical columns such as contract type and document type are encoded.

Conditional Training: The model is conditioned on fraud label, allowing generation of both fraud and non-fraud synthetic samples on demand.

Quality Validation: Generated samples are validated through statistical similarity tests comparing distributions of key features between real and synthetic data.

## 3.6.5 Application Scenarios

### Scenario A: Data Augmentation

For rare fraud types with few historical samples, synthetic data augments the training set. If only 50 SIM Box fraud cases exist in the dataset, the generative model can produce 500 statistically similar samples while introducing controlled variation. This addresses class imbalance and improves model generalization.

### Scenario B: Stress Testing

The simulation module can generate attack scenarios that have not yet been observed:

Novel Attack Patterns: By interpolating between known fraud types, synthetic samples represent potential hybrid attacks.
Volume Testing: Generate thousands of simultaneous fraud attempts to test system throughput.
Adversarial Samples: Create samples near decision boundaries to identify model weaknesses.

### Scenario C: Privacy-Preserving Data Sharing

When sharing data across departments or jurisdictions, synthetic data replaces real user records. The synthetic dataset maintains statistical utility for model training while containing zero actual user information, satisfying PDPO requirements.

## 3.6.6 Integration with Dashboard

The Fraud Simulator page in the Wutong Defense Console provides an interactive interface:

Live Generation: Operators can generate synthetic fraud samples with configurable parameters such as fraud type, intensity, and target demographics.

Model Testing: Generated samples are passed through the detection pipeline to observe rule triggers and ML scores.

What-If Analysis: Operators can explore how the system would respond to hypothetical attack scenarios before they occur.

## 3.6.7 Limitations

Synthetic data supplements but does not replace real data for model training. Key limitations include:

Distribution Shift: If real fraud tactics evolve beyond the training distribution, synthetic samples based on historical data may not capture new patterns.

Correlation Preservation: Complex feature interactions may not be perfectly preserved, potentially affecting model calibration.

Validation Requirement: All synthetic data used for training must pass statistical validation tests to ensure quality.

## 3.6.8 Privacy Considerations

The synthetic simulation module maintains privacy compliance:

No PII in Output: Generated samples contain synthetic identifiers only. No real phone numbers, user IDs, or personal information appear in outputs.

Differential Privacy Integration: The training process can incorporate differential privacy mechanisms to provide formal privacy guarantees on the learned distribution.

Purpose Limitation: Synthetic data is used exclusively for internal testing and training. Generated samples are not stored permanently and are regenerated on demand.
