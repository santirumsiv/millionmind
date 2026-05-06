import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * Write a CSV string to a temporary file and open the system share sheet.
 * Falls back to an alert with the path if sharing isn't available.
 *
 * Uses the modern expo-file-system v19+ File/Paths API.
 */
export async function shareCsv(csv: string, filename: string): Promise<void> {
  try {
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(csv);

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert("Sharing unavailable", `Saved locally: ${filename}`);
      return;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: filename,
      UTI: "public.comma-separated-values-text",
    });
  } catch (e) {
    Alert.alert(
      "Export failed",
      e instanceof Error ? e.message : "Could not export CSV.",
    );
  }
}
