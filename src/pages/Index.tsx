import { Button } from "@/components/ui/button";
import { useState } from "react";

const openPopup = () => {
  window.open(
    "",
    "popup",
    "width=200,height=300,toolbar=no,location=no,menubar=no"
  );
};

const Index = () => {
  const [pipSupported] = useState(
    () => "documentPictureInPicture" in window
  );

  const openPictureInPicture = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("Document Picture-in-Picture is not supported in this browser. Try Chrome 116+.");
      return;
    }

    let pipWindow: Window;
    try {
      pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 300,
        height: 200,
      });
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        alert(
          "Document PiP must be called from a top-level page, not an iframe.\n\n" +
          "Publish the site or open it directly (not in the Lovable preview) to test this feature."
        );
      } else {
        alert("Failed to open PiP window: " + e.message);
      }
      return;
    }

    // Copy stylesheets into PiP window
    const style = pipWindow.document.createElement("style");
    style.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: ui-monospace, monospace;
        background: hsl(220 20% 10%);
        color: hsl(210 20% 90%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: 12px;
        padding: 16px;
      }
      h2 { font-size: 14px; color: hsl(142 60% 50%); }
      .controls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
      button {
        background: hsl(220 15% 18%);
        color: hsl(210 20% 90%);
        border: 1px solid hsl(220 15% 25%);
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-family: ui-monospace, monospace;
        cursor: pointer;
        transition: background 0.15s;
      }
      button:hover { background: hsl(220 15% 25%); }
      button.active { background: hsl(142 60% 25%); border-color: hsl(142 60% 40%); }
      .status { font-size: 11px; color: hsl(215 15% 55%); text-align: center; }
    `;
    pipWindow.document.head.appendChild(style);

    // Build PiP UI
    const container = pipWindow.document.createElement("div");
    container.innerHTML = `
      <h2>🎥 Meeting Controls</h2>
      <div class="controls">
        <button id="mute-btn">🔊 Unmuted</button>
        <button id="react-btn">👍 React</button>
        <button id="hand-btn">✋ Raise Hand</button>
      </div>
      <div class="status" id="status">Ready</div>
    `;
    pipWindow.document.body.appendChild(container);

    const muteBtn = pipWindow.document.getElementById("mute-btn")!;
    const reactBtn = pipWindow.document.getElementById("react-btn")!;
    const handBtn = pipWindow.document.getElementById("hand-btn")!;
    const status = pipWindow.document.getElementById("status")!;

    let muted = false;
    let handRaised = false;

    muteBtn.addEventListener("click", () => {
      muted = !muted;
      muteBtn.textContent = muted ? "🔇 Muted" : "🔊 Unmuted";
      muteBtn.classList.toggle("active", muted);
      status.textContent = muted ? "Microphone muted" : "Microphone on";
    });

    const reactions = ["👍", "❤️", "😂", "🎉", "👏"];
    let reactionIdx = 0;
    reactBtn.addEventListener("click", () => {
      const emoji = reactions[reactionIdx % reactions.length];
      reactionIdx++;
      status.textContent = `Reacted: ${emoji}`;
    });

    handBtn.addEventListener("click", () => {
      handRaised = !handRaised;
      handBtn.textContent = handRaised ? "✋ Lower Hand" : "✋ Raise Hand";
      handBtn.classList.toggle("active", handRaised);
      status.textContent = handRaised ? "Hand raised" : "Hand lowered";
    });

    // Set up media session action handlers
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Meeting Controls",
        artist: "PiP Demo",
      });

      navigator.mediaSession.setActionHandler("play", () => {
        muted = false;
        muteBtn.textContent = "🔊 Unmuted";
        muteBtn.classList.remove("active");
        status.textContent = "Microphone on (via media session)";
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        muted = true;
        muteBtn.textContent = "🔇 Muted";
        muteBtn.classList.add("active");
        status.textContent = "Microphone muted (via media session)";
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handRaised = !handRaised;
        handBtn.textContent = handRaised ? "✋ Lower Hand" : "✋ Raise Hand";
        handBtn.classList.toggle("active", handRaised);
        status.textContent = handRaised ? "Hand raised (via media session)" : "Hand lowered (via media session)";
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        const emoji = reactions[reactionIdx % reactions.length];
        reactionIdx++;
        status.textContent = `Reacted: ${emoji} (via media session)`;
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="font-mono text-sm text-muted-foreground">~/dev</div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        <span className="text-primary">&gt;</span> developer
      </h1>
      <p className="max-w-md text-center text-muted-foreground">
        Building things for the web. Clean code, sharp pixels.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <Button onClick={openPopup} variant="outline" className="font-mono">
          window.open() Popup
        </Button>
        <Button onClick={openPictureInPicture} className="font-mono">
          Document PiP + MediaSession
        </Button>
        {!pipSupported && (
          <p className="text-xs text-destructive text-center">
            Document PiP requires Chrome 116+
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;
