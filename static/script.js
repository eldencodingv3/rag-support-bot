const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, sender, sources) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}-message`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    msgDiv.appendChild(bubble);

    if (sources && sources.length > 0) {
        const sourcesDiv = document.createElement("div");
        sourcesDiv.className = "sources";
        sources.forEach(function (src) {
            const badge = document.createElement("span");
            badge.className = "source-badge";
            badge.textContent = src.category;
            sourcesDiv.appendChild(badge);
        });
        msgDiv.appendChild(sourcesDiv);
    }

    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function addErrorMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message bot-message";

    const bubble = document.createElement("div");
    bubble.className = "bubble error-bubble";
    bubble.textContent = text;
    msgDiv.appendChild(bubble);

    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping() {
    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.id = "typingIndicator";
    indicator.innerHTML = "<span></span><span></span><span></span>";
    chatArea.appendChild(indicator);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    messageInput.value = "";
    sendBtn.disabled = true;
    showTyping();

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
        });

        hideTyping();

        if (!res.ok) {
            const err = await res.json().catch(function () {
                return { detail: "Something went wrong" };
            });
            addErrorMessage("Error: " + (err.detail || "Something went wrong"));
        } else {
            const data = await res.json();
            addMessage(data.response, "bot", data.sources);
        }
    } catch (e) {
        hideTyping();
        addErrorMessage("Failed to connect to the server. Please try again.");
    }

    sendBtn.disabled = false;
    messageInput.focus();
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
});

messageInput.focus();
