const BACKEND_URL = "http://127.0.0.1:5000";

export async function fetchDynamicHint(
    DYNAMIC_HINT_URL,
    promptParameters,
    onChunkReceived,
    onSuccessfulCompletion,
    onError,
    problemID,
    variabilization,
    context
) {
    try {
        console.log("========================================");
        console.log("SENDING REQUEST TO EDUTUTOR BACKEND");
        console.log("========================================");
        console.log("Prompt parameters:", promptParameters);

        const response = await fetch(
            `${BACKEND_URL}/generate-hint`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    promptParameters: promptParameters,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "EduTutor backend error:",
                errorText
            );

            throw new Error(
                `Backend request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        console.log("========================================");
        console.log("EDUTUTOR BACKEND RESPONSE");
        console.log("========================================");
        console.log(data);

        if (!data.success) {
            throw new Error(
                data.error || "Hint generation failed."
            );
        }

        const generatedHint = data.hint || "";

        if (!generatedHint.trim()) {
            throw new Error(
                "Backend returned an empty hint."
            );
        }

        console.log("========================================");
        console.log("AI GENERATED HINT");
        console.log("========================================");
        console.log(generatedHint);

        /*
         * IMPORTANT:
         *
         * Do NOT pass the generated hint through renderGPTText().
         *
         * The backend already returns clean student-facing text.
         * Passing it through the old KaTeX/GPT rendering pipeline
         * can cause:
         *
         *   KaTeX can only parse string typed expression
         *
         * The hint is therefore sent directly to OATutor.
         */

        const finalHint = generatedHint.trim();

        console.log("========================================");
        console.log("FINAL STUDENT HINT");
        console.log("========================================");
        console.log(finalHint);

        /*
         * Send the plain-text AI hint to the existing OATutor UI.
         */
        onChunkReceived(finalHint);

        /*
         * Tell OATutor that generation has finished.
         */
        onSuccessfulCompletion();

    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "ERROR FETCHING DYNAMIC HINT"
        );

        console.error(
            "========================================"
        );

        console.error(error);

        onError(error);
    }
}