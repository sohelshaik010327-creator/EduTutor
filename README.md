EduTutor

EduTutor: Democratising AI-Powered Personalised Learning Through Open-Source Large Language Models and Multi-Subject Knowledge Tracing

EduTutor is an MSc dissertation research prototype that extends the open-source OATutor intelligent tutoring system with Bayesian Knowledge Tracing (BKT), adaptive problem selection, open-source large language model (LLM) support, hallucination-aware response verification, multi-subject learning support, and educator-oriented learning analytics.

Project Overview

EduTutor builds on the adaptive tutoring foundation of OATutor and adds functionality for personalised, AI-supported learning and educator monitoring.

Key Features

Bayesian Knowledge Tracing (BKT) for learner mastery estimation

Adaptive problem selection based on estimated learner knowledge

Open-source LLM support for contextual tutoring assistance and hints

Hallucination-aware response verification as a reliability layer

Multi-subject adaptive learning support

Learning analytics for learner interaction and performance data

Educator dashboard for learner activity, mastery and progress

Extensible open-source research architecture

Relationship to OATutor

EduTutor is an extension of OATutor, not a replacement for it.

OATutor provides the underlying adaptive tutoring foundation, including learner modelling, adaptive question sequencing, content structures and interaction logging. EduTutor extends this foundation with BKT integration, AI-supported assistance, response verification and educator analytics.

Original OATutor research:

Pardos, Z. A., Tang, M., Anastasopoulos, I., Sheel, S. K., & Zhang, E. (2023). OATutor: An open-source adaptive tutoring system and curated content library for learning sciences research. Proceedings of the 2023 CHI Conference on Human Factors in Computing Systems. https://doi.org/10.1145/3544548.3581574

System Architecture

At a high level:

Learner
   |
   v
EduTutor Interface
   |
   +--------------------+
   |                    |
   v                    v
Learner Interaction   AI Assistance
   |                    |
   v                    v
BKT Learner Model    Open-source LLM
   |                    |
   v                    v
Adaptive Problem     Response
Selection             Verification
   |                    |
   +---------+----------+
             |
             v
     Personalised Support
             |
             v
      Learning Analytics
             |
             v
      Educator Dashboard

BKT maintains learner mastery estimates from interaction evidence. The adaptive selection mechanism can use these estimates when selecting subsequent learning problems. The LLM pathway provides contextual assistance, while response verification provides an additional reliability layer.

Main Technologies

React.js

Material UI

Python / Flask backend components

Bayesian Knowledge Tracing

Open-source LLM integration

Learning analytics and event tracking

Git / GitHub

OATutor content and adaptive-learning components

The exact configuration depends on the current project deployment.

Repository Structure

EduTutor is based on the OATutor project structure with EduTutor-specific additions.

EduTutor/
├── src/
│   ├── components/
│   ├── models/
│   │   └── BKT/
│   ├── content-sources/
│   ├── platform-logic/
│   ├── config/
│   └── ...
├── public/
├── package.json
├── README.md
└── ...

Requirements

Install the required development tools:

Git

Node.js

npm

Python 3.x for backend/services where applicable

Check installations:

git --version
node --version
npm --version
python --version

Installation

Clone the EduTutor repository:

git clone https://github.com/sohelshaik010327-creator/EduTutor.git
cd EduTutor

Install frontend dependencies:

npm install

If the repository contains a Python backend, create a virtual environment:

Windows

python -m venv .venv
.venv\Scripts\activate

macOS/Linux

python3 -m venv .venv
source .venv/bin/activate

Install Python dependencies when a requirements file is present:

pip install -r requirements.txt

Running the Application

Start the frontend using the configured project command:

npm run start

If a separate Flask/backend service is required, start it using the backend entry point and configuration included in the repository.

AI / LLM Configuration

EduTutor can use an LLM service for contextual tutoring assistance.

Never commit API keys, passwords, tokens or private credentials to GitHub.

Use environment variables or a local .env file excluded by .gitignore.

Example:

LLM_API_KEY=your_key_here

Use the variable name required by the current backend configuration.

Before pushing:

git status

Check that .env, credentials, private keys and other secrets are not included.

Adaptive Learning with BKT

EduTutor uses Bayesian Knowledge Tracing to estimate learner knowledge and support adaptive problem selection.

Learner response
      ↓
Knowledge-state update
      ↓
Updated mastery estimate
      ↓
Adaptive problem selection
      ↓
Next learning activity

Key reference:

Corbett, A. T., & Anderson, J. R. (1994). Knowledge tracing: Modeling the acquisition of procedural knowledge. User Modeling and User-Adapted Interaction, 4(4), 253–278. https://doi.org/10.1007/BF01099821

AI-Supported Tutoring

The LLM component provides a mechanism for contextual educational assistance, including hints and explanations.

The components have distinct roles:

BKT          → estimates learner state
LLM          → generates contextual assistance
Verification → provides a reliability check

This separates learner-state estimation from generative assistance within the tutoring workflow.

Hallucination-Aware Response Verification

LLM-generated educational responses can contain inaccurate or misleading information. EduTutor therefore includes a response-verification layer between generation and learner-facing assistance.

The verification mechanism is a safeguard and is not claimed to guarantee correctness.

Future evaluation can measure:

response correctness

verification accuracy

false positives

false negatives

instructional relevance

Learning Analytics

EduTutor records learner interaction information to support monitoring and evaluation.

Recorded measures include:

problem attempts

completed problems

answer responses

correct answers

mastery updates

response time

interaction events

learner progress

These measures are presented through the educator-oriented analytics functionality.

Evaluation

EduTutor was evaluated using technical system metrics and a beneficiary/user evaluation.

The technical evaluation included measures such as problem completion, answer performance, mastery updates, response time and interaction events.

A beneficiary evaluation was conducted with 10 participants using eight five-point Likert-scale questions covering usability, personalisation, hints, AI-supported assistance, trust, progress monitoring and overall usefulness.

The overall beneficiary evaluation mean was 4.38/5.00.

These results represent prototype operation and user perception. They do not by themselves establish long-term learning gains or causal superiority over OATutor.

Project Limitations

The current project has several limitations:

The technical evaluation was conducted within a limited interaction scope.

The recorded evaluation dataset contained 0 AI-hint events, preventing quantitative analysis of AI-hint usage and learning impact.

The response-verification mechanism was not evaluated against a sufficiently large labelled hallucination dataset.

No controlled learner experiment directly comparing EduTutor with OATutor was conducted.

The beneficiary evaluation involved 10 participants.

Future Development

Potential improvements include:

more practice problems per topic

improved difficulty progression

more detailed step-by-step hints

visual explanations

improved progress tracking

greater topic variety

practice-session reminders

reliable AI-hint event logging

labelled evaluation of AI responses

controlled EduTutor versus OATutor studies

expanded educator analytics

subject-specific prompt engineering

Academic Context

EduTutor was developed as part of an MSc dissertation investigating how open-source LLMs, Bayesian Knowledge Tracing and learning analytics can be combined to support personalised, scalable and more trustworthy intelligent tutoring.

Attribution

EduTutor builds upon the open-source OATutor project developed by the UC Berkeley research community.

Original OATutor repository:

https://github.com/CAHLR/OATutor

OATutor content repository:

https://github.com/CAHLR/OATutor-Content

Where OATutor source code or content is reused, retain the applicable original attribution and licensing information.

Citation

If you use or discuss the original OATutor system, please cite:

@inproceedings{pardos2023oatutor,
  title={OATutor: An Open-source Adaptive Tutoring System and Curated Content Library for Learning Sciences Research},
  author={Pardos, Zachary A. and Tang, Matthew and Anastasopoulos, Ioannis and Sheel, Shreya K. and Zhang, Ethan},
  booktitle={Proceedings of the 2023 CHI Conference on Human Factors in Computing Systems},
  pages={1--17},
  year={2023},
  organization={Association for Computing Machinery},
  doi={10.1145/3544548.3581574}
}

Repository

https://github.com/sohelshaik010327-creator/EduTutor

EduTutor — Open-source AI-supported personalised learning research prototype.