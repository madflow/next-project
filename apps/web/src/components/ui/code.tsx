import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";

export function Code({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <ScrollArea>
      <pre
        data-slot="pre"
        className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)}
        {...props}>
        <code>{props.children}</code>
      </pre>
    </ScrollArea>
  );
}
