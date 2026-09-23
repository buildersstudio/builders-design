import { PromptButton } from "./ui";

export function Head({ title, count, prompt, children }: { title: string; count?: number; prompt?: string; children?: React.ReactNode }) {
  return (
    <header className="work-head">
      <h1 className="work-title">{title}{!!count && <span>{count}</span>}</h1>
      <div style={{ display: "flex", gap: 2 }}>{children}{prompt && <PromptButton text={prompt} />}</div>
    </header>
  );
}

export function Empty({ what, prompt }: { what: string; prompt: string }) {
  return (
    <div className="empty">
      <div>
        <p>No {what} yet.</p>
        <PromptButton text={prompt} label="Copy prompt for your model" />
      </div>
    </div>
  );
}
