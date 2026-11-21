import { useGlobalSearchParams } from 'expo-router';

/**
 * Live tuning for the compare screens: `?u={"tintA":0.7,...}` overrides shader uniforms and
 * `?blur=4` the blur, without a native rebuild. Spread onto the glass (lab props the public
 * types don't list).
 */
export function useTuneProps(): Record<string, unknown> {
  const { u, blur } = useGlobalSearchParams<{ u?: string; blur?: string }>();
  const props: Record<string, unknown> = {};
  if (u) {
    try {
      props.uniforms = JSON.parse(u);
    } catch {
      // Ignore a malformed override.
    }
  }
  if (blur) props.blurRadius = Number(blur);
  return props;
}
