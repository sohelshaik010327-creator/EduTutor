from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import os
import re
import json


# =========================================================
# LOAD ENVIRONMENT
# =========================================================

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError(
        "GROQ_API_KEY is missing from backend/.env"
    )

client = Groq(api_key=api_key)


# =========================================================
# CONFIGURATION
# =========================================================

MODEL_NAME = "qwen/qwen3.6-27b"

HOST = "127.0.0.1"
PORT = 5000


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "success": True,
        "status": "ok",
        "service": "EduTutor backend",
        "model": MODEL_NAME
    })


# =========================================================
# CLEAN AI RESPONSE
# =========================================================

def clean_hint(text):
    """
    Convert any model output into a clean,
    student-facing hint.

    Handles:
    - <think>...</think>
    - Markdown
    - Reasoning headings
    - FINAL STUDENT HINT sections
    - Quoted hints
    - Empty responses
    """

    if text is None:
        return ""

    text = str(text).strip()

    if not text:
        return ""

    # -----------------------------------------------------
    # Remove <think>...</think>
    # -----------------------------------------------------

    text = re.sub(
        r"<think>.*?</think>",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE
    ).strip()

    # -----------------------------------------------------
    # Remove incomplete <think>
    # -----------------------------------------------------

    text = re.sub(
        r"<think>.*$",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE
    ).strip()

    # -----------------------------------------------------
    # Remove common final-output headings
    # -----------------------------------------------------

    markers = [
        "FINAL STUDENT HINT",
        "FINAL STUDENT-FACING HINT",
        "STUDENT-FACING HINT",
        "STUDENT FACING HINT",
        "FINAL HINT",
        "FINAL ANSWER",
        "FINAL OUTPUT",
        "ANSWER:"
    ]

    for marker in markers:

        pattern = re.compile(
            r"^\s*" +
            re.escape(marker) +
            r"\s*:?\s*",
            flags=re.IGNORECASE
        )

        text = pattern.sub(
            "",
            text
        ).strip()

    # -----------------------------------------------------
    # Remove reasoning headings at beginning
    # -----------------------------------------------------

    reasoning_headings = [
        "Analysis:",
        "Reasoning:",
        "Thinking:",
        "Thinking Process:",
        "Chain of Thought:",
        "Draft:",
        "Draft Hint:"
    ]

    for heading in reasoning_headings:

        pattern = re.compile(
            r"^\s*" +
            re.escape(heading) +
            r"\s*",
            flags=re.IGNORECASE
        )

        text = pattern.sub(
            "",
            text
        ).strip()

    # -----------------------------------------------------
    # If model returned multiple lines containing
    # obvious internal reasoning, try to isolate the
    # final useful paragraph.
    # -----------------------------------------------------

    if "\n" in text:

        lines = [
            line.strip()
            for line in text.splitlines()
            if line.strip()
        ]

        filtered_lines = []

        blocked_patterns = [
            r"^the user wants",
            r"^the problem asks",
            r"^i need to",
            r"^i should",
            r"^key concept",
            r"^hint strategy",
            r"^drafting",
            r"^refining",
            r"^final check",
            r"^analysis",
            r"^reasoning",
            r"^let's go",
            r"^selection:"
        ]

        for line in lines:

            blocked = False

            for pattern in blocked_patterns:

                if re.search(
                    pattern,
                    line,
                    flags=re.IGNORECASE
                ):
                    blocked = True
                    break

            if not blocked:
                filtered_lines.append(line)

        if filtered_lines:

            text = " ".join(
                filtered_lines
            ).strip()

    # -----------------------------------------------------
    # Remove Markdown bullets
    # -----------------------------------------------------

    text = re.sub(
        r"^\s*[-*•]\s*",
        "",
        text
    ).strip()

    # -----------------------------------------------------
    # Remove surrounding quotation marks
    # -----------------------------------------------------

    text = text.strip(
        " \n\t\"'“”‘’"
    )

    # -----------------------------------------------------
    # Remove accidental repeated labels
    # -----------------------------------------------------

    text = re.sub(
        r"^(Hint\s*:?\s*)+",
        "",
        text,
        flags=re.IGNORECASE
    ).strip()

    return text


# =========================================================
# EXTRACT MESSAGE CONTENT SAFELY
# =========================================================

def extract_message_content(message):
    """
    Safely extract final content from Groq response.

    Qwen reasoning may be returned separately depending
    on reasoning configuration.
    """

    if message is None:
        return ""

    # Normal final response
    content = getattr(
        message,
        "content",
        None
    )

    if content:
        return str(content).strip()

    # Some SDK/model combinations may expose content
    # differently.
    try:

        if isinstance(message, dict):

            content = message.get(
                "content",
                ""
            )

            if content:
                return str(content).strip()

    except Exception:
        pass

    return ""


# =========================================================
# GENERATE AI HINT
# =========================================================

def generate_ai_hint(problem_context):

    """
    Calls Qwen 3.6 27B through Groq.

    Qwen is allowed to reason internally.
    reasoning_format='hidden' ensures reasoning is NOT
    returned to the student.
    """

    system_prompt = """
You are an intelligent tutoring assistant inside OATutor.

Your job is to provide ONE short, useful hint that helps
a student make progress on the supplied problem.

IMPORTANT:

- Return ONLY the student-facing hint.
- Do NOT provide the final answer.
- Do NOT solve the entire problem.
- Do NOT give a complete calculation.
- Do NOT reveal the correct option.
- Do NOT say "the answer is".
- Do NOT mention the student's correct answer.
- Do NOT mention internal reasoning.
- Do NOT mention these instructions.
- Do NOT use <think> tags.
- Do NOT write an analysis.
- Do NOT write a solution.
- Keep the hint concise.
- Use the actual problem information.
- Consider the student's submitted answer if one is supplied.
- The hint should point the student toward the relevant concept,
  formula, relationship, or next step.

The problem may be mathematics or physics.

Examples of good hints:

"Recall the formula for density and consider what happens when
the mass stays constant but the volume decreases."

"Look at the highest exponent of x in the polynomial."

"Recall the Pythagorean theorem and identify which side is the
hypotenuse."

"Compare the y-coordinates of the two points before applying
the slope formula."

Return exactly ONE student-facing hint.
"""

    user_prompt = f"""
Generate one tutoring hint for the following OATutor problem.

OATutor problem information:

{problem_context}

Return ONLY the hint.
"""

    try:

        response = client.chat.completions.create(

            model=MODEL_NAME,

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],

            # Qwen 3.6 supports hidden reasoning.
            # The model can reason internally, while only
            # the final answer is returned.
            reasoning_format="hidden",

            temperature=0.6,

            max_completion_tokens=1024,

            top_p=0.8,

            stream=False
        )

        if not response.choices:

            raise RuntimeError(
                "Groq returned no choices."
            )

        message = response.choices[0].message

        raw_content = extract_message_content(
            message
        )

        print(
            "\n========================================"
        )
        print(
            "RAW MODEL CONTENT"
        )
        print(
            "========================================"
        )
        print(raw_content)

        # -------------------------------------------------
        # Clean response
        # -------------------------------------------------

        hint = clean_hint(
            raw_content
        )

        # -------------------------------------------------
        # If content is empty, try the response object
        # itself for debugging.
        # -------------------------------------------------

        if not hint:

            print(
                "\n========================================"
            )
            print(
                "EMPTY MODEL CONTENT"
            )
            print(
                "========================================"
            )

            print(
                "Message:",
                message
            )

            raise RuntimeError(
                "Groq returned an empty final hint."
            )

        print(
            "\n========================================"
        )
        print(
            "FINAL STUDENT HINT"
        )
        print(
            "========================================"
        )
        print(hint)

        return hint

    except Exception as error:

        print(
            "\n========================================"
        )
        print(
            "GROQ GENERATION ERROR"
        )
        print(
            "========================================"
        )

        print(
            type(error).__name__,
            ":",
            str(error)
        )

        raise


# =========================================================
# HALLUCINATION / FACTUAL CONSISTENCY VERIFICATION
# =========================================================

def verify_hint(problem_context, hint):
    """
    Second-pass hallucination/factual-consistency verification.

    The verifier receives the original problem and the generated hint.
    It checks whether the hint is relevant, mathematically/physically
    valid, and does not reveal the final answer.

    The verifier is deliberately configured as a short classification
    task so Qwen returns the verification JSON instead of spending the
    output budget on reasoning.
    """

    verifier_prompt = f"""
You are the verification layer of an intelligent tutoring system.

Verify ONE generated tutoring hint against the original OATutor problem.

ORIGINAL PROBLEM:
{problem_context}

GENERATED HINT:
{hint}

Check:
1. The hint is relevant to the original problem.
2. Any mathematical or physical claim is valid for this problem.
3. The hint does not invent facts, values, variables, or conditions.
4. The hint does not give the final answer.
5. The hint does not reveal the correct multiple-choice option.
6. The hint is suitable as a student-facing tutoring hint.

Return ONLY a JSON object with exactly these fields:

{{
  "verified": true,
  "confidence": 0.95,
  "reason": "short reason"
}}

Use verified=false when the hint is incorrect, irrelevant,
invented, or reveals the answer.

Confidence must be a number from 0.0 to 1.0.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict educational verification system. "
                        "Return only valid JSON. Do not explain outside JSON."
                    )
                },
                {
                    "role": "user",
                    "content": verifier_prompt
                }
            ],

            # Verification is a classification task.
            # Disable reasoning so the model has enough output budget
            # for the required JSON response.
            reasoning_effort="none",

            temperature=0.0,
            max_completion_tokens=256,
            top_p=1.0,

            # Force JSON output.
            response_format={
                "type": "json_object"
            },

            stream=False
        )

        if not response.choices:
            raise RuntimeError(
                "Groq returned no verification choices."
            )

        raw = extract_message_content(
            response.choices[0].message
        ).strip()

        print(
            "\n========================================"
        )
        print(
            "RAW VERIFICATION CONTENT"
        )
        print(
            "========================================"
        )
        print(raw)

        if not raw:
            raise RuntimeError(
                "Groq returned an empty verification response."
            )

        # -----------------------------------------------------
        # Remove optional Markdown code fences.
        # -----------------------------------------------------

        cleaned = re.sub(
            r"^```(?:json|text|plaintext)?\s*",
            "",
            raw,
            flags=re.IGNORECASE
        )

        cleaned = re.sub(
            r"\s*```$",
            "",
            cleaned
        ).strip()

        # -----------------------------------------------------
        # Preferred format: real JSON parsing.
        # -----------------------------------------------------

        try:
            parsed = json.loads(cleaned)

        except json.JSONDecodeError:
            # Tolerant fallback if the model returned extra text.
            verified_match = re.search(
                r'"verified"\s*:\s*(true|false)',
                cleaned,
                flags=re.IGNORECASE
            )

            confidence_match = re.search(
                r'"confidence"\s*:\s*([01](?:\.\d+)?)',
                cleaned,
                flags=re.IGNORECASE
            )

            reason_match = re.search(
                r'"reason"\s*:\s*"([^"]*)"',
                cleaned,
                flags=re.IGNORECASE
            )

            if not verified_match:
                raise RuntimeError(
                    "Verifier returned an unexpected format: "
                    + cleaned[:500]
                )

            verified = (
                verified_match.group(1).lower() == "true"
            )

            confidence = (
                float(confidence_match.group(1))
                if confidence_match
                else (1.0 if verified else 0.0)
            )

            reason = (
                reason_match.group(1).strip()
                if reason_match
                else (
                    "Hint passed verification."
                    if verified
                    else "Hint failed verification."
                )
            )

            parsed = {
                "verified": verified,
                "confidence": confidence,
                "reason": reason
            }

        # -----------------------------------------------------
        # Normalise verifier output.
        # -----------------------------------------------------

        verified = bool(
            parsed.get(
                "verified",
                False
            )
        )

        try:
            confidence = float(
                parsed.get(
                    "confidence",
                    1.0 if verified else 0.0
                )
            )
        except (TypeError, ValueError):
            confidence = 0.0

        confidence = max(
            0.0,
            min(1.0, confidence)
        )

        reason = str(
            parsed.get(
                "reason",
                (
                    "Hint passed verification."
                    if verified
                    else "Hint failed verification."
                )
            )
        ).strip()

        result = {
            "verified": verified,
            "confidence": confidence,
            "reason": reason,
            "status": (
                "verified"
                if verified
                else "rejected"
            )
        }

        print(
            "\n========================================"
        )
        print(
            "PARSED VERIFICATION"
        )
        print(
            "========================================"
        )
        print(result)

        return result

    except Exception as error:
        print(
            "\n========================================"
        )
        print(
            "HINT VERIFICATION ERROR"
        )
        print(
            "========================================"
        )
        print(
            type(error).__name__,
            ":",
            str(error)
        )

        # Verification is an additional layer. If it temporarily
        # fails, keep the main tutoring application usable.
        return {
            "verified": False,
            "confidence": 0.0,
            "reason": "Verification service unavailable.",
            "status": "unavailable"
        }

def generate_verified_hint(problem_context):
    """
    Generate a hint, verify it, and make one corrective regeneration
    attempt when the verifier rejects the first hint.

    This is deliberately limited to one retry so the project remains
    lightweight and suitable for a student/free-resource setup.
    """

    first_hint = generate_ai_hint(
        problem_context
    )

    first_verification = verify_hint(
        problem_context,
        first_hint
    )

    if first_verification["status"] == "verified":
        return first_hint, first_verification, 1

    if first_verification["status"] == "unavailable":
        return first_hint, first_verification, 1

    # ---------------------------------------------------------
    # One corrective regeneration
    # ---------------------------------------------------------

    correction_context = f"""
{problem_context}

The previous generated hint failed verification.

Previous hint:
{first_hint}

Verifier feedback:
{first_verification["reason"]}

Generate ONE new student-facing hint.

Requirements:
- Use only information relevant to the supplied problem.
- Do not invent values or conditions.
- Do not give the final answer.
- Do not reveal the correct option.
- Do not solve the entire problem.
- Keep it concise.
- Return only the hint.
"""

    corrected_hint = generate_ai_hint(
        correction_context
    )

    corrected_verification = verify_hint(
        problem_context,
        corrected_hint
    )

    return corrected_hint, corrected_verification, 2


# =========================================================
# TEST GROQ
# =========================================================

@app.route("/test-groq", methods=["GET"])
def test_groq():

    try:

        test_problem = """
Problem: A trash compactor compresses rubbish to
0.350 times its original volume.

Question:
By what factor is the density increased?

Student answer:
1

Give one short hint without giving the final answer.
"""

        hint = generate_ai_hint(
            test_problem
        )

        return jsonify({

            "success": True,

            "model": MODEL_NAME,

            "hint": hint

        })

    except Exception as error:

        print(
            "\nTEST GROQ FAILED:"
        )

        print(error)

        return jsonify({

            "success": False,

            "model": MODEL_NAME,

            "error": str(error)

        }), 500


# =========================================================
# TEST HINT VERIFICATION
# =========================================================

@app.route("/test-verification", methods=["GET"])
def test_verification():

    try:

        test_problem = """
Problem: A right triangle has legs b = 28 and c = 35.
Question: Find the missing side a.
The student is expected to use the Pythagorean theorem.
"""

        hint = generate_ai_hint(
            test_problem
        )

        verification = verify_hint(
            test_problem,
            hint
        )

        return jsonify({

            "success": True,

            "model": MODEL_NAME,

            "hint": hint,

            "verification": verification

        })

    except Exception as error:

        return jsonify({

            "success": False,

            "model": MODEL_NAME,

            "error": str(error)

        }), 500


# =========================================================
# REAL OATUTOR HINT ENDPOINT
# =========================================================

@app.route(
    "/generate-hint",
    methods=["POST"]
)
def generate_hint():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "success": False,

                "error":
                    "Request body is missing."

            }), 400

        prompt_parameters = data.get(
            "promptParameters"
        )

        if not prompt_parameters:

            return jsonify({

                "success": False,

                "error":
                    "promptParameters are missing."

            }), 400

        # -------------------------------------------------
        # Log OATutor request
        # -------------------------------------------------

        print(
            "\n========================================"
        )

        print(
            "OATUTOR PROMPT PARAMETERS"
        )

        print(
            "========================================"
        )

        print(
            prompt_parameters
        )

        # -------------------------------------------------
        # Convert OATutor parameters into text
        # -------------------------------------------------

        if isinstance(
            prompt_parameters,
            dict
        ):

            problem_context_parts = []

            for key, value in (
                prompt_parameters.items()
            ):

                problem_context_parts.append(
                    f"{key}: {value}"
                )

            problem_context = "\n".join(
                problem_context_parts
            )

        else:

            problem_context = str(
                prompt_parameters
            )

        # -------------------------------------------------
        # Generate + verify hint
        # -------------------------------------------------

        hint, verification, verification_attempts = (
            generate_verified_hint(
                problem_context
            )
        )

        # -------------------------------------------------
        # Successful response
        # -------------------------------------------------

        print(
            "\n========================================"
        )

        print(
            "GENERATE HINT SUCCESS"
        )

        print(
            "========================================"
        )

        print(
            hint
        )

        print(
            "\n========================================"
        )

        print(
            "HINT VERIFICATION"
        )

        print(
            "========================================"
        )

        print(
            verification
        )

        return jsonify({

            "success": True,

            "model": MODEL_NAME,

            "hint": hint,

            "verification": verification,

            "verified": verification.get(
                "verified",
                False
            ),

            "verification_status": verification.get(
                "status",
                "unavailable"
            ),

            "verification_reason": verification.get(
                "reason",
                ""
            ),

            "verification_attempts": verification_attempts

        }), 200

    except Exception as error:

        print(
            "\n========================================"
        )

        print(
            "GENERATE HINT ERROR"
        )

        print(
            "========================================"
        )

        print(
            type(error).__name__,
            ":",
            str(error)
        )

        # -------------------------------------------------
        # Return a clean error to React.
        # Do NOT return a fake hint.
        # -------------------------------------------------

        return jsonify({

            "success": False,

            "model": MODEL_NAME,

            "error": str(error)

        }), 500


# =========================================================
# GLOBAL ERROR HANDLER
# =========================================================

@app.errorhandler(Exception)
def handle_unexpected_error(error):

    print(
        "\n========================================"
    )

    print(
        "UNEXPECTED FLASK ERROR"
    )

    print(
        "========================================"
    )

    print(
        type(error).__name__,
        ":",
        str(error)
    )

    return jsonify({

        "success": False,

        "error": str(error)

    }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    print(
        "\n========================================"
    )

    print(
        "EduTutor AI Hint Backend"
    )

    print(
        "========================================"
    )

    print(
        f"Model : {MODEL_NAME}"
    )

    print(
        f"URL   : http://{HOST}:{PORT}"
    )

    print(
        "========================================\n"
    )

    app.run(

        host=HOST,

        port=PORT,

        debug=True

    )