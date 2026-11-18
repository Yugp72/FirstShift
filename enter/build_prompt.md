Build "FirstShift AI Core" for Team33 (Imperial Treasure Palo Alto challenge). It is a small backend service that the FirstShift web app calls for all of its AI work, using Enter's built-in AI model access (no external API keys).

Requirements:
1. One HTTP endpoint: POST /api/ai
   - Request JSON: {"task": string, "prompt": string, "response_format": "json"}
     task is one of: grade_answer, translate, summarize_readiness, generate_job_posts.
   - Send `prompt` to the built-in AI model with this system instruction: "You are the AI core of FirstShift, a restaurant hiring and multilingual training tool. Reply with ONLY valid JSON that matches the shape described at the end of the prompt. No markdown fences, no extra text."
   - Response JSON: {"output": <the model's reply as a JSON string>}
   - If the model reply isn't valid JSON, retry once, then return HTTP 502 with {"error": "..."}.
   - Allow CORS from any origin (the FirstShift app runs on another domain).
   - Reject prompts longer than 8000 characters with HTTP 400.
2. A simple home page at "/" that says "FirstShift AI Core, built on Enter by Converge.AI". It should include a small form to try the endpoint: a task dropdown, a prompt textarea, a Send button, and the JSON response shown below.
3. No login and no database. Keep it minimal.
