import { fetchResponse } from './API.js';

async function generate(draftContainer, messages, draftTitle) {
    const loadingIcon = document.createElement("img");
    loadingIcon.src = "/images/loading.png";
    loadingIcon.classList.add("rotate");

    draftContainer.textContent = "";
    draftContainer.appendChild(loadingIcon);

    try {
        const { apiKey, model, maxTokens } = await browser.storage.local.get(
                                                ["apiKey","model", "maxTokens"]);
        const response = await fetchResponse(apiKey, model, messages, maxTokens);
        draftContainer.innerText = response;
        messages.push({role: "assistant", content: response});
        document.title = draftTitle;
        await browser.storage.local.set({messages});
    } catch (error) {
        console.error(error);
        let error_details = '';
        let error_startIndex = error.message.indexOf('{');
        let error_jsonString = error.message.substring(error_startIndex);
        try {
            let error_obj = JSON.parse(error_jsonString);
            error_details = error_obj.error.message + "<br><br>Error Code: " + error_obj.error.code;
        } catch (e) {
            console.error("Error parsing JSON string:", e);
        }
        draftContainer.innerHTML = "Error: Unable to retrieve data.<br><br>" + error_details;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const regenButton = document.getElementById('regenerate');
    const chatButton = document.getElementById('chat-button');
    const insertButton = document.getElementById('insert-button');
    const draftContainer = document.getElementById("draft-container");
    const { messages, draftTitle, tabId } = await browser.storage.local.get(["messages", "draftTitle", "tabId"]);
    regenButton.addEventListener("click", () => generate(draftContainer, messages, draftTitle));
    chatButton.addEventListener("click", async () => {
        await browser.storage.local.set({messages});
        await browser.windows.create({ url: "/html/chat.html", type: "popup",
					     width: 600, height: 600 });
        window.close();
    });
    insertButton.addEventListener("click", async () => {
        browser.tabs.sendMessage(tabId, { command: "replaceSelectedText", text: draftContainer.innerText });
        browser.windows.getCurrent().then((w) => {browser.windows.remove(w.id)})
    });
    generate(draftContainer, messages, draftTitle);
    await browser.storage.local.set({ messages: "[]", draftTitle: "" });
});
