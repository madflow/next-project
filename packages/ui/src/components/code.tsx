import { cn } from "@repo/ui/lib/utils";
import { ScrollArea, ScrollBar } from "./scroll-area";

type CodeProps = React.ComponentProps<"pre"> & {
  scrollAreaClassName?: string;
};

export function Code({ className, scrollAreaClassName, ...props }: CodeProps) {
  return (
    <ScrollArea className={cn("max-w-full min-w-0", scrollAreaClassName)}>
      <pre
        data-slot="pre"
        className={cn(
          "bg-card text-card-foreground flex min-w-full flex-col gap-6 rounded-xl border py-6 shadow-sm",
          className
        )}
        {...props}>
        <code>{props.children}</code>
      </pre>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
