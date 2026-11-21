package expo.modules.androidglassview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewDefinitionBuilder

class ExpoAndroidGlassViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAndroidGlassView")

    /** What this device offers, for the lab's header. */
    Function("getBackdropInfo") {
      mapOf(
        "supported" to BackdropApi.isSupported,
        "renderNodeSupported" to BackdropApi.hasRenderNodeSetter,
        "sdkFull" to BackdropApi.sdkFull,
        "sdkIntFull" to BackdropApi.sdkIntFull,
      )
    }

    /** Lab: force the capture path even where the platform backdrop exists. */
    Function("setForceCapture") { force: Boolean -> BackdropApi.forceCapture = force }

    View(AndroidGlassView::class) {
      Name("AndroidGlassView")
      Events("onBackdropStatus", "onPress")
      glassProps<AndroidGlassView>()
      Prop("interactive") { view: AndroidGlassView, value: Boolean? -> view.interactive = value ?: false }
      OnViewDidUpdateProps { view: AndroidGlassView -> view.commit() }
    }

    View(AndroidGlassTabs::class) {
      Name("AndroidGlassTabs")
      Events("onBackdropStatus", "onTabSelected")
      glassProps<AndroidGlassTabs>()
      Prop("tabsCount") { view: AndroidGlassTabs, value: Int? -> view.tabsCount = value ?: 0 }
      Prop("selectedIndex") { view: AndroidGlassTabs, value: Int? -> view.setSelectedIndex(value ?: 0) }
      Prop("accentColor") { view: AndroidGlassTabs, value: Int? -> view.accentColor = value }
      OnViewDidUpdateProps { view: AndroidGlassTabs -> view.commit() }
    }

    View(GlassBackdropSource::class) {
      Name("GlassBackdropSource")
      Prop("name") { view: GlassBackdropSource, value: String? -> view.sourceName = value }
    }

    View(AndroidGlassToggle::class) {
      Name("AndroidGlassToggle")
      Events("onValueChange")
      Prop("value") { view: AndroidGlassToggle, value: Boolean? -> view.setValue(value ?: false) }
      Prop("backdropSource") { view: AndroidGlassToggle, value: String? -> view.backdropSource = value }
      Prop("theme") { view: AndroidGlassToggle, value: String? -> view.theme = GlassTheme.of(value) }
      Prop("accentColor") { view: AndroidGlassToggle, value: Int? -> view.accentColor = value }
      Prop("trackColor") { view: AndroidGlassToggle, value: Int? -> view.trackColor = value }
      OnViewDidUpdateProps { view: AndroidGlassToggle -> view.invalidate() }
    }

    View(AndroidGlassSlider::class) {
      Name("AndroidGlassSlider")
      Events("onValueChange", "onSlidingComplete")
      Prop("backdropSource") { view: AndroidGlassSlider, value: String? -> view.backdropSource = value }
      Prop("minimumValue") { view: AndroidGlassSlider, value: Float? -> view.minimumValue = value ?: 0f }
      Prop("maximumValue") { view: AndroidGlassSlider, value: Float? -> view.maximumValue = value ?: 1f }
      Prop("theme") { view: AndroidGlassSlider, value: String? -> view.theme = GlassTheme.of(value) }
      Prop("accentColor") { view: AndroidGlassSlider, value: Int? -> view.accentColor = value }
      Prop("trackColor") { view: AndroidGlassSlider, value: Int? -> view.trackColor = value }
      Prop("value") { view: AndroidGlassSlider, value: Float? -> view.value = value ?: 0f }
      // Maps the value once min and max of the same update are in.
      OnViewDidUpdateProps { view: AndroidGlassSlider -> view.commit() }
    }
  }
}

/** The glass props every glass view takes. */
private inline fun <reified T : AndroidGlassView> ViewDefinitionBuilder<T>.glassProps() {
  // Public.
  Prop("cornerRadius") { view: T, value: Float? -> view.cornerRadius = value ?: 0f }
  Prop("blurRadius") { view: T, value: Float? -> view.blurRadius = value }
  Prop("glassEffectStyle") { view: T, value: String? -> view.glassEffectStyle = GlassEffectStyle.of(value) }
  Prop("refraction") { view: T, value: Boolean? -> view.refraction = value ?: true }
  Prop("tintColor") { view: T, value: Int? -> view.tintColor = value }
  Prop("fallbackColor") { view: T, value: Int? -> view.fallbackColor = value }
  Prop("theme") { view: T, value: String? -> view.theme = GlassTheme.of(value) }
  Prop("backdropSource") { view: T, value: String? -> view.backdropSource = value }
  // Lab only (the example's backdrop lab).
  Prop("effect") { view: T, value: String? -> view.labEffect = value }
  Prop("radius") { view: T, value: Float? -> view.blurRadius = value }
  Prop("tileMode") { view: T, value: String? -> view.tileMode = value ?: "clamp" }
  Prop("offsetX") { view: T, value: Float? -> view.offsetX = value ?: 0f }
  Prop("offsetY") { view: T, value: Float? -> view.offsetY = value ?: 0f }
  Prop("clip") { view: T, value: Boolean? -> view.clip = value ?: true }
  Prop("refractionHeight") { view: T, value: Float? -> view.refractionHeight = value ?: 24f }
  Prop("amount") { view: T, value: Float? -> view.amount = value ?: 24f }
  Prop("selfEffect") { view: T, value: String? -> view.selfEffect = value ?: "none" }
  Prop("margin") { view: T, value: Float? -> view.margin = value ?: 0f }
  Prop("uniforms") { view: T, value: Map<String, Double>? ->
    view.uniforms = value?.mapValues { it.value.toFloat() } ?: emptyMap()
  }
  Prop("strokeColor") { view: T, value: Int? -> view.strokeColor = value }
}
