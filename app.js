// Set this to the deployed Cloudflare Worker URL.
const API_URL = "https://ydkgpt.uchihajikoma.workers.dev/";
const $ = s => document.querySelector(s);
let messages = [], busy = false;

function addMessage(role, content) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "U" : "Y";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  row.append(avatar, bubble);
  $("#messages").append(row);
  $("#welcome").style.display = "none";
  $("#conversation").scrollTop = $("#conversation").scrollHeight;
  return bubble;
}
function resetChat() {
  messages = [];
  $("#messages").innerHTML = "";
  $("#welcome").style.display = "";
}
function historyItem(text) {
  const el = document.createElement("div");
  el.className = "history-item";
  el.textContent = text;
  $("#history").prepend(el);
}
async function send(text) {
  const content = text.trim();
  if (!content || busy) return;
  if (API_URL.includes("YOUR-WORKER")) {
    addMessage("assistant", "Bạn cần triển khai Cloudflare Worker rồi thay API_URL trong app.js bằng URL Worker.");
    return;
  }
  $("#prompt").value = "";
  $("#prompt").style.height = "auto";
  messages.push({role:"user", content});
  addMessage("user", content);
  const bubble = addMessage("assistant", "YDK đang xử lý...");
  bubble.classList.add("typing");
  busy = true; $("#sendBtn").disabled = true;
  try {
    const r = await fetch(API_URL, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "API request failed");
    bubble.classList.remove("typing");
    bubble.textContent = data.reply;
    messages.push({role:"assistant", content:data.reply});
    historyItem(content);
  } catch(e) {
    bubble.classList.remove("typing");
    bubble.textContent = "Lỗi kết nối: " + e.message;
    messages.pop();
  } finally {
    busy = false; $("#sendBtn").disabled = false;
    $("#conversation").scrollTop = $("#conversation").scrollHeight;
  }
}
$("#chatForm").addEventListener("submit", e => {e.preventDefault();send($("#prompt").value);});
$("#prompt").addEventListener("input", e => {e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,180)+"px";});
$("#prompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatForm").requestSubmit();}});
document.querySelectorAll(".suggestion").forEach(b=>b.addEventListener("click",()=>send(b.dataset.prompt)));
$("#newChat").onclick=()=>{resetChat();$("#sidebar").classList.remove("open");};
$("#clearBtn").onclick=resetChat;
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
