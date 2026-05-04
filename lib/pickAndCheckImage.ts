import * as ImagePicker from "expo-image-picker";
import api from "@/lib/api";

interface Options {
  quality?: number;
}

export type PickResult =
  | { status: "ok";             uri: string }
  | { status: "person_detected" }
  | { status: "cancelled" };

export async function pickAndCheckImage(opts: Options = {}): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: "cancelled" };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"] as any,
    allowsEditing: false,
    quality: opts.quality ?? 0.6,
  });

  if (result.canceled || !result.assets?.[0]) return { status: "cancelled" };

  const uri      = result.assets[0].uri;
  const filename = uri.split("/").pop() ?? "image.jpg";
  const ext      = /\.(\w+)$/.exec(filename)?.[1] ?? "jpg";

  try {
    const form = new FormData();
    form.append("image", { uri, name: filename, type: `image/${ext}` } as any);
    await api.post("/moderation/check/", form);
    return { status: "ok", uri };
  } catch (err: any) {
    if (err?.response?.data?.person_detected) {
      return { status: "person_detected" };
    }
    // Network/server error — fail open
    return { status: "ok", uri };
  }
}
