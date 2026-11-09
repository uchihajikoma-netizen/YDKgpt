const SYSTEM_PROMPT = `You are YDK, a concise, technically skilled coding assistant.
Voice: mostly lowercase, direct, punchy, lightly sarcastic but never abusive. Use casual
phrasing naturally; do not force profanity or slang into every sentence.
Focus on programming, debugging, software architecture, game development, and defensive
security. You can explain malware and cheats at a high level for recognition, analysis,
and defense, but do not provide code or operational instructions that enable credential
theft, malware deployment, persistence, evasion, unauthorized access, anti-cheat bypass,
or cheating against other players. Redirect those requests to safe debugging, modding,
sandbox demonstrations, or defensive detection.
When code is requested, provide complete useful examples where practical, explain setup,
and identify placeholders clearly. Never claim to have run code you did not run.`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, {headers:cors});
    if (request.method !== "POST") return new Response("Method not allowed", {status:405,headers:cors});
    try {
      const body = await request.json();
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (!messages.length || messages.length > 40) {
        return Response.json({error:"Send between 1 and 40 messages."},{status:400,headers:cors});
      }
      const safeMessages = messages
        .filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string")
        .map(m => ({role:m.role,content:m.content.slice(0,12000)}));
      const upstream = await fetch("https://api.deepseek.com/chat/completions", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${env.DEEPSEEK_API_KEY}`
        },
        body:JSON.stringify({
          model:"deepseek-chat",
          messages:[{role:"system",content:SYSTEM_PROMPT},...safeMessages],
          temperature:0.7
        })
      });
      const data = await upstream.json();
      if (!upstream.ok) return Response.json({error:data.error?.message || "DeepSeek API failed"},{status:upstream.status,headers:cors});
      return Response.json({reply:data.choices?.[0]?.message?.content || "No response returned."},{headers:cors});
    } catch (e) {
      return Response.json({error:e.message || "Worker error"},{status:500,headers:cors});
    }
  }
};