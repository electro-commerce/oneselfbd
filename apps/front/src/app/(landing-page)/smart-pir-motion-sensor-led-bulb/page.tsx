import { permanentRedirect } from "next/navigation";

export default function LegacySensorBulbPage() {
  permanentRedirect("/steps/smart-pir-motion-sensor-led-bulb");
}
