import { notFound } from "next/navigation";
import { getGroupByInviteCode } from "@/actions/group";
import { JoinGroupForm } from "./join-group-form";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function JoinGroupPage({ params }: Props) {
  const { code } = await params;
  const group = await getGroupByInviteCode(code);

  if (!group) {
    notFound();
  }

  return <JoinGroupForm group={group} inviteCode={code} />;
}
