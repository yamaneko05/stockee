import { notFound } from "next/navigation";
import { getGroup } from "@/actions/group";
import { GroupSettings } from "./group-settings";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GroupPage({ params }: Props) {
  const { id } = await params;
  const group = await getGroup(id);

  if (!group) {
    notFound();
  }

  return <GroupSettings group={group} />;
}
