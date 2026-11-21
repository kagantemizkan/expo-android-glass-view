/*
 * Ported from src/glassPassShader.ts in arya3d/liquid-glass-webgpu
 * (https://github.com/arya3d/liquid-glass-webgpu), Copyright (c) 2026 arya3d,
 * released under the MIT License. See THIRD_PARTY_NOTICES.md.
 *
 * Changes from upstream: WGSL fragment shader translated to AGSL for
 * RenderEffect.createRuntimeShaderEffect; the page texture is the view's backdrop (`content`),
 * sampled in the view's own pixel coordinates; the glass fills the view (its half size and
 * corner radius come from the view's size and the cornerRadius prop); the look values are
 * uniforms with the upstream values as defaults; the second (mask) output is dropped; a press
 * highlight is added (`press`, `touch`: the white wash and finger glow of Kyant's
 * InteractiveHighlight, Apache 2.0); an `opacity` uniform fades the glass in (the tab bar's
 * droplet); `maskSharpness`, `ringSharpness` and `ringStrength` set the edge and the rim ring
 * (upstream constants 32, 16 and 1); `bendSplit` scales the red/blue bend difference; `gain` brightens the backdrop, `saturation` scales its colour, `ringWidth` / `ringFalloff` shape the rim, `lensMirror` turns the lens over vertically at the rim, `lift` brightens the glass evenly, `lensCurve` replaces the upstream lens ramp constant (0.25) for the vertical bend, `lensXRatio` narrows the horizontal one and `tintR/G/B/A` mix a surface colour over the refracted backdrop (the glass styles);
 * an `origin` uniform places the glass inside a larger node (the capture path's
 * sampling margin).
 */
package expo.modules.androidglassview

/**
 * The glass of arya3d/liquid-glass-webgpu, as an AGSL backdrop effect.
 *
 * Positions are in "glass space": pixels relative to the view's centre, divided by the view's
 * height (so the height spans -0.5..0.5). For every pixel it takes the signed distance to the
 * rounded box, bends the backdrop like a lens (edges sample towards the centre, so it never reads
 * outside the view), splits red and blue near the rim, and adds Fresnel, an edge ring, a specular
 * highlight and a rim glow.
 */
internal object LiquidGlassShader {

  /** Upstream GLASS_LOOK values. */
  val DEFAULTS: Map<String, Float> = mapOf(
    "lensRefraction" to 0.3f,
    "sharp" to 0.5f,
    "f0" to 0.04f,
    "dispersion" to 0.008f,
    "specPower" to 32.0f,
    "edgeHighlight" to 2.0f,
    "rimStrength" to 0.15f,
    "fresnelAmount" to 0.3f,
    // Not upstream: fades the whole glass in (1 = upstream look).
    "opacity" to 1f,
    // Not upstream: the glass surface, mixed over the refracted backdrop (alpha 0 = none). Mixing
    // towards a colour is what makes the glass adapt like iOS: near white over light content,
    // grey over dark content.
    "tintR" to 1f,
    "tintG" to 1f,
    "tintB" to 1f,
    "tintA" to 0f,
    // Not upstream: multiplies the refracted backdrop's brightness before the tint. Light content
    // goes white, dark content barely changes (iOS clear glass over a bright sky).
    "gain" to 1f,
    // Not upstream: scales how differently red and blue bend (upstream 0.98 / 1.02 = 1).
    "bendSplit" to 1f,
    // Not upstream: the rim. Upstream values give a ~10px bright ring; iOS shows a hairline.
    "maskSharpness" to 32f,
    "ringSharpness" to 16f,
    "ringStrength" to 1f,
    // Not upstream: colour saturation of the refracted backdrop (1 = unchanged). iOS's light
    // regular glass boosts it (~1.4) so the frosted surface keeps some of the colour behind it.
    "saturation" to 1f,
    // Not upstream: a rim of fixed width (in glass heights; 0 = the upstream one-pixel ring),
    // so a wider rim does not get dimmer. iOS draws ~1pt.
    "ringWidth" to 0f,
    // Not upstream: how much the rim fades from the top edge to the bottom one (0 = even). iOS
    // lights its glass from above, so the bottom rim is dimmer.
    "ringFalloff" to 0f,
    // Not upstream: how far the lens turns over at the rim (0 = upstream: the rim samples the
    // centre; 1 = the rim samples the mirrored opposite side). iOS's glass reflects what lies
    // across it near the edges, most visibly in the clear style.
    "lensMirror" to 0f,
    // Not upstream: a constant brightening of the glass (0..1). iOS's clear glass lifts what is
    // behind it by about 7.6%, the same amount over dark and light content.
    "lift" to 0f,
    // Not upstream (a constant there, 0.25): how the lens ramps from the rim inwards. Lower is
    // steeper (the bend happens right at the rim); 1 ramps evenly across the band, as iOS does.
    "lensCurve" to 0.25f,
    // Not upstream: the horizontal bend's band as a fraction of lensRefraction (1 = the same).
    // A wide band bends the rounded ends into a swirl; iOS keeps them straight.
    "lensXRatio" to 1f,
  )

  const val SOURCE = """
    uniform shader content;
    uniform float2 size;
    uniform float radius;
    // The glass's top-left inside the node the effect runs on: 0 on the platform path, the
    // sampling margin on the capture path.
    uniform float2 origin;

    uniform float lensRefraction;
    uniform float sharp;
    uniform float f0;
    uniform float dispersion;
    uniform float specPower;
    uniform float edgeHighlight;
    uniform float rimStrength;
    uniform float fresnelAmount;
    uniform float opacity;
    uniform float tintR;
    uniform float tintG;
    uniform float tintB;
    uniform float tintA;
    uniform float gain;
    uniform float bendSplit;
    uniform float maskSharpness;
    uniform float ringSharpness;
    uniform float ringStrength;
    uniform float saturation;
    uniform float ringWidth;
    uniform float ringFalloff;
    uniform float lensMirror;
    uniform float lift;
    uniform float lensCurve;
    uniform float lensXRatio;

    // Pressable glass: 0..1 press progress and the finger position in view pixels.
    uniform float press;
    uniform float2 touch;

    const float FACE_ON_SPREAD_CUT = 0.909;
    const float RIM_POWER = 3.0;
    const float SPECULAR_ON_RING = 0.5;
    const float3 VIEW_DIRECTION = float3(0.0, 0.0, 1.0);
    const float3 KEY_LIGHT = float3(0.3, -0.5, 1.0);

    half4 samplePage(float2 position) {
      return content.eval(position * size.y + size * 0.5 + origin);
    }

    float roundedBoxDistance(float2 pt, float2 halfSize, float cornerRadius) {
      float2 fromCorner = abs(pt) - halfSize + cornerRadius;
      float outside = length(max(fromCorner, float2(0.0)));
      float inside = min(max(fromCorner.x, fromCorner.y), 0.0);
      return outside + inside - cornerRadius;
    }

    float glassEdgeDistance(float2 position) {
      float2 halfSize = size * 0.5 / size.y;
      float cornerRadius = min(radius, min(size.x, size.y) * 0.5) / size.y;
      return roundedBoxDistance(position, halfSize, cornerRadius);
    }

    float coverage(float edgeDistance, float sharpness) {
      return clamp(-edgeDistance / sharp * sharpness, 0.0, 1.0);
    }

    float lensBend(float edgeDistance) {
      const float QUARTER_TURN = 1.57;
      float depth = clamp(-edgeDistance / lensRefraction, 0.0, 1.0);
      return pow(depth, lensCurve) * QUARTER_TURN;
    }

    // The horizontal bend: the upstream lens over a band of lensRefraction × lensXRatio.
    float lensBendX(float edgeDistance) {
      const float FLAT_TOP_POWER = 0.25;
      const float QUARTER_TURN = 1.57;
      float depth = clamp(-edgeDistance / (lensRefraction * lensXRatio), 0.0, 1.0);
      return pow(depth, FLAT_TOP_POWER) * QUARTER_TURN;
    }

    float3 surfaceNormal(float2 position) {
      const float2 PROBE_X = float2(0.001, 0.0);
      const float2 PROBE_Y = float2(0.0, 0.001);
      float slopeX = glassEdgeDistance(position + PROBE_X) - glassEdgeDistance(position - PROBE_X);
      float slopeY = glassEdgeDistance(position + PROBE_Y) - glassEdgeDistance(position - PROBE_Y);
      return normalize(float3(slopeX, slopeY, 1.0));
    }

    float schlickFresnel(float facingViewer) {
      float grazing = 1.0 - facingViewer;
      return f0 + (1.0 - f0) * pow(grazing, 5.0);
    }

    float colourSpread(float facingViewer) {
      return dispersion * (1.0 - facingViewer * FACE_ON_SPREAD_CUT);
    }

    // Upstream sin(bend) for x; for y turned over by lensMirror (1 at the centre, -lensMirror at
    // the rim). Only y turns over: iOS reflects across the glass's height (like a cylinder), and
    // turning both axes swirls the content at the rounded ends.
    float2 lensScale(float2 bend) {
      return float2(sin(bend.x), sin(bend.y) * (1.0 + lensMirror) - lensMirror);
    }

    half4 refractPage(float2 position, float2 bend, float spread) {
      float RED_BEND = 1.0 - 0.02 * bendSplit;
      float BLUE_BEND = 1.0 + 0.02 * bendSplit;
      float2 bentLookup = position * lensScale(bend);
      float2 channelOffset = bentLookup * spread;
      float2 redLookup = (position - channelOffset) * lensScale(bend * RED_BEND);
      float2 blueLookup = (position + channelOffset) * lensScale(bend * BLUE_BEND);
      return half4(samplePage(redLookup).r, samplePage(bentLookup).g, samplePage(blueLookup).b, 1.0);
    }

    float edgeRing(float edgeDistance) {
      if (ringWidth > 0.0) {
        // A band of ringWidth just inside the edge, peaking at the edge and fading inwards.
        return clamp(1.0 + edgeDistance / ringWidth, 0.0, 1.0) * step(edgeDistance, 0.0);
      }
      float onePixel = 1.0 / size.y;
      return coverage(edgeDistance - onePixel, ringSharpness) - coverage(edgeDistance, ringSharpness);
    }

    float specular(float3 normal) {
      float3 lightDirection = normalize(KEY_LIGHT);
      float3 halfway = normalize(lightDirection + VIEW_DIRECTION);
      return pow(max(dot(normal, halfway), 0.0), specPower);
    }

    half4 main(float2 coord) {
      float2 position = (coord - origin - size * 0.5) / size.y;
      float edgeDistance = glassEdgeDistance(position);
      float glassCoverage = coverage(edgeDistance, maskSharpness);
      if (glassCoverage <= 0.0) {
        return content.eval(coord);
      }

      // Deep inside the glass the lens is flat (full bend), the surface faces the viewer (the
      // fresnel term is f0, the rim 0), the edge ring is 0 and the glass is opaque, so one sample
      // and no surface normal do what the rest does; the colour spread there is a fraction of a
      // pixel. Most of a large glass is interior.
      float2 innerScale = lensScale(float2(1.57));
      float ringBand = ringWidth > 0.0 ? ringWidth : sharp / ringSharpness;
      if (edgeDistance < -max(lensRefraction, ringBand) && glassCoverage >= 1.0 && opacity >= 1.0) {
        float3 inner = float3(samplePage(position * innerScale).rgb);
        float innerLuma = dot(inner, float3(0.2126, 0.7152, 0.0722));
        inner = clamp(mix(float3(innerLuma), inner, saturation), 0.0, 1.0);
        float3 innerSurface = mix(min(inner * gain, float3(1.0)), float3(tintR, tintG, tintB), tintA);
        float3 innerLit = innerSurface + lift;
        if (press > 0.0) {
          float glowRadius = min(size.x, size.y) * 1.5;
          float glow = smoothstep(glowRadius, glowRadius * 0.5, distance(coord - origin, clamp(touch, float2(0.0), size)));
          innerLit += press * (0.08 + 0.15 * glow);
        }
        return half4(half3(innerLit * (1.0 + f0 * fresnelAmount)), 1.0);
      }

      float3 normal = surfaceNormal(position);
      float facingViewer = max(dot(normal, VIEW_DIRECTION), 0.0);
      float fresnel = schlickFresnel(facingViewer);

      float2 bend = lensXRatio == 1.0
          ? float2(lensBend(edgeDistance))
          : float2(lensBendX(edgeDistance), lensBend(edgeDistance));
      half4 refracted = refractPage(position, bend, colourSpread(facingViewer));

      float ring = edgeRing(edgeDistance) * (1.0 - ringFalloff * clamp(position.y + 0.5, 0.0, 1.0));
      float edgeLight = ring * ringStrength * (1.0 + fresnel * edgeHighlight);
      float shine = specular(normal) * ring * SPECULAR_ON_RING;
      float rim = pow(1.0 - facingViewer, RIM_POWER) * glassCoverage * rimStrength;

      float3 backdrop = float3(refracted.rgb);
      float luma = dot(backdrop, float3(0.2126, 0.7152, 0.0722));
      backdrop = clamp(mix(float3(luma), backdrop, saturation), 0.0, 1.0);
      float3 surface = mix(min(backdrop * gain, float3(1.0)), float3(tintR, tintG, tintB), tintA);
      float3 lit = surface + lift + edgeLight + shine + rim;

      // InteractiveHighlight: an 8% white wash plus a 15% glow around the finger, added (Plus).
      if (press > 0.0) {
        float glowRadius = min(size.x, size.y) * 1.5;
        float glow = smoothstep(glowRadius, glowRadius * 0.5, distance(coord - origin, clamp(touch, float2(0.0), size)));
        lit += press * (0.08 + 0.15 * glow) * glassCoverage;
      }
      half4 glass = half4(half3(lit * (1.0 + fresnel * fresnelAmount)), 1.0);

      float glassOpacity = smoothstep(0.0, 1.0, glassCoverage) * opacity;
      return mix(content.eval(coord), glass, half(glassOpacity));
    }
  """
}
