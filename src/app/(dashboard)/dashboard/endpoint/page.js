import { getMachineId } from "@/shared/utils/machine";
import EndpointPageClient from "./EndpointPageClient";

export default async function EndpointPage() {
  const machineId = await getMachineId();
  const isVercel = !!process.env.VERCEL;
  return <EndpointPageClient machineId={machineId} isVercel={isVercel} />;
}
