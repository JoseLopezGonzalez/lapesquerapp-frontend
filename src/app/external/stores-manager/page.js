import StoresManager from "@/components/Admin/Stores";
import { ExternalPageShell } from "@/components/External/ExternalPageShell";

export default function ExternalStoresManagerPage() {
  return (
    <ExternalPageShell>
      <StoresManager mode="external" />
    </ExternalPageShell>
  );
}
