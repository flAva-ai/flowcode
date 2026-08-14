import { redirect } from "next/navigation";

/** Legacy URL kept for bookmarked prototypes; the active builder lives at /. */
export default function BuilderPage() {
  redirect("/");
}
