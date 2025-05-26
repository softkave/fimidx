import { cn } from "@/src/lib/utils";
import { kFooterContact, WebFooterContact } from "./web-footer-contact";
import { kFooterLinkGroups, WebFooterLinkGroup } from "./web-footer-link-group";
export function WebFooter(props: { className?: string }) {
  return (
    <footer className={cn("bg-gray-100", props.className)}>
      <div className="flex flex-col gap-8 md:max-w-4xl mx-auto">
        <WebFooterLinkGroup group={kFooterLinkGroups[0]} />
        <WebFooterContact contact={kFooterContact} />
      </div>
    </footer>
  );
}
