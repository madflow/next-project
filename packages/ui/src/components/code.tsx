import { cn } from "@repo/ui/lib/utils";
import { ScrollArea } from "./scroll-area";

type CodeProps = React.ComponentProps<"pre"> & {
  scrollAreaClassName?: string;
};

export function Code({ className, scrollAreaClassName, ...props }: CodeProps) {
  return (
    <ScrollArea className={scrollAreaClassName}>
      <pre
        data-slot="pre"
        className={cn(
          "bg-card text-card-foreground flex min-w-full flex-col gap-6 rounded-xl border py-6 shadow-sm",
          className
        )}
        {...props}>
        <code>{props.children}</code>
      </pre>
    </ScrollArea>
  );
}
