import { Button } from "@/components/ui/button";
import { useRef, useState, useCallback } from "react";

const Index = () => {
  const [streaming, setStreaming] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [pipMode, setPipMode] = useState<"pip" | "popup" | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const externalWindowRef = useRef<Window | null>(null);

  const pipSupported = "documentPictureInPicture" in window;

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);

      // Show in main page video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare();
      });
    } catch {
      // User cancelled the picker
    }
  };

  const stopScreenShare = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (externalWindowRef.current) {
      externalWindowRef.current.close();
      externalWindowRef.current = null;
    }
    setStreaming(false);
    setPipMode(null);
  }, []);

  const openInPiP = async () => {
    if (!streamRef.current) return;

    // Try Document PiP first
    if (pipSupported) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 420,
          height: 320,
        });

        const style = pipWindow.document.createElement("style");
        style.textContent = `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: hsl(220 20% 8%); display: flex; flex-direction: column; height: 100vh; }
          video { width: 100%; flex: 1; object-fit: contain; background: #000; }
          .bar { display: flex; gap: 6px; padding: 8px; justify-content: center; background: hsl(220 20% 12%); }
          button {
            background: hsl(220 15% 18%); color: hsl(210 20% 90%);
            border: 1px solid hsl(220 15% 25%); border-radius: 6px;
            padding: 6px 12px; font-size: 12px; font-family: ui-monospace, monospace;
            cursor: pointer; transition: background 0.15s;
          }
          button:hover { background: hsl(220 15% 25%); }
          button.stop { background: hsl(0 60% 35%); border-color: hsl(0 60% 45%); }
          button.stop:hover { background: hsl(0 60% 45%); }
        `;
        pipWindow.document.head.appendChild(style);

        const video = pipWindow.document.createElement("video");
        video.srcObject = streamRef.current;
        video.autoplay = true;
        video.muted = true;
        pipWindow.document.body.appendChild(video);

        const bar = pipWindow.document.createElement("div");
        bar.className = "bar";

        const screenshotBtn = pipWindow.document.createElement("button");
        screenshotBtn.textContent = "📸 Screenshot";
        screenshotBtn.addEventListener("click", () => takeScreenshot(video));

        const stopBtn = pipWindow.document.createElement("button");
        stopBtn.textContent = "⏹ Stop";
        stopBtn.className = "stop";
        stopBtn.addEventListener("click", () => stopScreenShare());

        bar.appendChild(screenshotBtn);
        bar.appendChild(stopBtn);
        pipWindow.document.body.appendChild(bar);

        pipWindow.addEventListener("pagehide", () => {
          setPipMode(null);
        });

        externalWindowRef.current = pipWindow;
        setPipMode("pip");
        return;
      } catch (e: any) {
        if (e.name === "NotAllowedError") {
          // Fall through to popup
        } else {
          console.error("PiP failed:", e);
        }
      }
    }

    // Fallback: window.open popup
    openInPopup();
  };

  const openInPopup = () => {
    if (!streamRef.current) return;

    const popup = window.open("", "screenshare", "width=420,height=320,toolbar=no,location=no,menubar=no");
    if (!popup) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }

    popup.document.write(`<!DOCTYPE html>
      <html><head><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #111; display: flex; flex-direction: column; height: 100vh; font-family: ui-monospace, monospace; }
        video { width: 100%; flex: 1; object-fit: contain; background: #000; }
        .bar { display: flex; gap: 6px; padding: 8px; justify-content: center; background: hsl(220 20% 12%); }
        button {
          background: hsl(220 15% 18%); color: hsl(210 20% 90%);
          border: 1px solid hsl(220 15% 25%); border-radius: 6px;
          padding: 6px 12px; font-size: 12px; cursor: pointer;
        }
        button:hover { background: hsl(220 15% 25%); }
        button.stop { background: hsl(0 60% 35%); border-color: hsl(0 60% 45%); }
      </style></head><body>
        <video id="vid" autoplay muted></video>
        <div class="bar">
          <button id="ss-btn">📸 Screenshot</button>
          <button id="stop-btn" class="stop">⏹ Stop</button>
        </div>
      </body></html>
    `);
    popup.document.close();

    const vid = popup.document.getElementById("vid") as HTMLVideoElement;
    vid.srcObject = streamRef.current;

    popup.document.getElementById("ss-btn")!.addEventListener("click", () => takeScreenshot(vid));
    popup.document.getElementById("stop-btn")!.addEventListener("click", () => stopScreenShare());

    popup.addEventListener("beforeunload", () => setPipMode(null));

    externalWindowRef.current = popup;
    setPipMode("popup");
  };

  const takeScreenshot = useCallback((videoEl?: HTMLVideoElement) => {
    const video = videoEl || videoRef.current;
    if (!video || !streamRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setScreenshots((prev) => [dataUrl, ...prev]);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-8">
      <div className="font-mono text-sm text-muted-foreground">~/dev</div>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
        <span className="text-primary">&gt;</span> screen share
      </h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Share your screen, pop it out via Document PiP or a popup window, and take screenshots.
      </p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!streaming ? (
          <Button onClick={startScreenShare} className="font-mono">
            🖥 Start Screen Share
          </Button>
        ) : (
          <>
            <Button onClick={openInPiP} variant="outline" className="font-mono">
              {pipSupported ? "📌 Pop Out (PiP)" : "📌 Pop Out (Popup)"}
            </Button>
            <Button onClick={openInPopup} variant="outline" className="font-mono">
              🪟 Open in Popup
            </Button>
            <Button onClick={() => takeScreenshot()} variant="secondary" className="font-mono">
              📸 Take Screenshot
            </Button>
            <Button onClick={stopScreenShare} variant="destructive" className="font-mono">
              ⏹ Stop
            </Button>
          </>
        )}
      </div>

      {pipMode && (
        <p className="mt-2 text-xs text-muted-foreground font-mono">
          Viewing in: {pipMode === "pip" ? "Document Picture-in-Picture" : "Popup window"}
        </p>
      )}

      {/* Video preview */}
      <div className="mt-6 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full bg-black"
          style={{ minHeight: 200 }}
        />
      </div>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="mb-3 font-mono text-lg font-semibold text-foreground">
            Screenshots ({screenshots.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((src, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                <img src={src} alt={`Screenshot ${screenshots.length - i}`} className="w-full" />
                <a
                  href={src}
                  download={`screenshot-${screenshots.length - i}.png`}
                  className="absolute bottom-2 right-2 rounded bg-primary px-2 py-1 font-mono text-xs text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ⬇ Save
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
