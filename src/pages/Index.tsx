import { Button } from "@/components/ui/button";

const openPopup = () => {
  window.open(
    "",
    "popup",
    "width=150,height=200,toolbar=no,location=no,menubar=no"
  );
};

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="font-mono text-sm text-muted-foreground">~/dev</div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        <span className="text-primary">&gt;</span> developer
      </h1>
      <p className="max-w-md text-center text-muted-foreground">
        Building things for the web. Clean code, sharp pixels.
      </p>
      <Button onClick={openPopup} className="mt-4 font-mono">
        Open Popup Window
      </Button>
    </div>
  );
};

export default Index;
