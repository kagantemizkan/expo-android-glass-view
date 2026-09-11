package expo.modules.androidglassview

import android.view.View
import androidx.compose.ui.graphics.Color
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewDefinitionBuilder

class ExpoAndroidGlassViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAndroidGlassView")

    // Bumped when the backdrop capture changes in a way JS may need to know about.
    // 2: ancestors of a sampling glass view are never drawn again through their own draw()
    //    (0.1.1 crashed inside react-native-screens stacks).
    Constant("captureRevision") { 3 }

    View(AndroidGlassView::class) {
      Name("AndroidGlassView")

      Prop("cornerRadius") { view: AndroidGlassView, value: Float? ->
        view.glassState.cornerRadius = value ?: GlassState.DEFAULT_CORNER_RADIUS
      }
      Prop("blurRadius") { view: AndroidGlassView, value: Float? ->
        view.glassState.blurRadius = value ?: GlassState.DEFAULT_BLUR_RADIUS
      }
      Prop("refractionHeight") { view: AndroidGlassView, value: Float? ->
        view.glassState.refractionHeight = value ?: GlassState.DEFAULT_REFRACTION_HEIGHT
      }
      Prop("refractionAmount") { view: AndroidGlassView, value: Float? ->
        view.glassState.refractionAmount = value ?: GlassState.DEFAULT_REFRACTION_AMOUNT
      }
      Prop("chromaticAberration") { view: AndroidGlassView, value: Boolean? ->
        view.glassState.chromaticAberration = value ?: false
      }
      Prop("depthEffect") { view: AndroidGlassView, value: Boolean? ->
        view.glassState.depthEffect = value ?: false
      }
      Prop("vibrancy") { view: AndroidGlassView, value: Boolean? ->
        view.glassState.vibrancy = value ?: true
      }
      Prop("highlight") { view: AndroidGlassView, value: Boolean? ->
        view.glassState.highlight = value ?: true
      }
      Prop("shadow") { view: AndroidGlassView, value: Boolean? ->
        view.glassState.shadow = value ?: true
      }
      // Colours arrive as ARGB ints from processColor() on the JS side.
      Prop("tintColor") { view: AndroidGlassView, value: Int? ->
        view.glassState.tintColor = value.toColorOr(Color.Unspecified)
      }
      Prop("surfaceColor") { view: AndroidGlassView, value: Int? ->
        view.glassState.surfaceColor = value.toColorOr(Color.Unspecified)
      }
      Prop("fallbackColor") { view: AndroidGlassView, value: Int? ->
        view.glassState.fallbackColor = value.toColorOr(GlassState.DEFAULT_FALLBACK_COLOR)
      }

      ReactChildren()
    }

    View(AndroidGlassButton::class) {
      Name("AndroidGlassButton")
      Events("onPress")

      Prop("cornerRadius") { view: AndroidGlassButton, value: Float? ->
        view.glassState.cornerRadius = value ?: AndroidGlassButton.DEFAULT_CORNER_RADIUS
      }
      Prop("blurRadius") { view: AndroidGlassButton, value: Float? ->
        view.glassState.blurRadius = value ?: GlassState.DEFAULT_BLUR_RADIUS
      }
      Prop("refractionHeight") { view: AndroidGlassButton, value: Float? ->
        view.glassState.refractionHeight = value ?: GlassState.DEFAULT_REFRACTION_HEIGHT
      }
      Prop("refractionAmount") { view: AndroidGlassButton, value: Float? ->
        view.glassState.refractionAmount = value ?: GlassState.DEFAULT_REFRACTION_AMOUNT
      }
      Prop("chromaticAberration") { view: AndroidGlassButton, value: Boolean? ->
        view.glassState.chromaticAberration = value ?: false
      }
      Prop("depthEffect") { view: AndroidGlassButton, value: Boolean? ->
        view.glassState.depthEffect = value ?: false
      }
      Prop("vibrancy") { view: AndroidGlassButton, value: Boolean? ->
        view.glassState.vibrancy = value ?: true
      }
      Prop("highlight") { view: AndroidGlassButton, value: Boolean? ->
        view.glassState.highlight = value ?: true
      }
      Prop("shadow") { view: AndroidGlassButton, value: Boolean? ->
        view.glassState.shadow = value ?: true
      }
      Prop("tintColor") { view: AndroidGlassButton, value: Int? ->
        view.glassState.tintColor = value.toColorOr(Color.Unspecified)
      }
      Prop("surfaceColor") { view: AndroidGlassButton, value: Int? ->
        view.glassState.surfaceColor = value.toColorOr(Color.Unspecified)
      }
      Prop("fallbackColor") { view: AndroidGlassButton, value: Int? ->
        view.glassState.fallbackColor = value.toColorOr(GlassState.DEFAULT_FALLBACK_COLOR)
      }
      Prop("interactive") { view: AndroidGlassButton, value: Boolean? ->
        view.interactive = value ?: true
      }

      ReactChildren()
    }

    // Toggle, slider and tab bar: the user changes the value natively too, so the value prop is
    // only applied (once all props of an update are set) when JS has caught up; see ControlledProp.

    View(AndroidGlassToggle::class) {
      Name("AndroidGlassToggle")
      Events("onValueChange")

      Prop("value") { view: AndroidGlassToggle, value: Boolean? ->
        view.valueProp.value = value ?: false
      }
      Prop("mostRecentEventCount") { view: AndroidGlassToggle, value: Int? ->
        view.valueProp.mostRecentEventCount = value ?: 0
      }
      Prop("accentColor") { view: AndroidGlassToggle, value: Int? ->
        view.accentColor = value?.let { Color(it) }
      }
      Prop("trackColor") { view: AndroidGlassToggle, value: Int? ->
        view.trackColor = value?.let { Color(it) }
      }

      OnViewDidUpdateProps { view: AndroidGlassToggle ->
        view.applyProps()
      }
    }

    View(AndroidGlassSlider::class) {
      Name("AndroidGlassSlider")
      Events("onValueChange", "onSlidingComplete")

      Prop("value") { view: AndroidGlassSlider, value: Float? ->
        view.valueProp.value = value ?: 0f
      }
      Prop("mostRecentEventCount") { view: AndroidGlassSlider, value: Int? ->
        view.valueProp.mostRecentEventCount = value ?: 0
      }
      Prop("minimumValue") { view: AndroidGlassSlider, value: Float? ->
        view.minimumValue = value ?: 0f
      }
      Prop("maximumValue") { view: AndroidGlassSlider, value: Float? ->
        view.maximumValue = value ?: 1f
      }
      Prop("accentColor") { view: AndroidGlassSlider, value: Int? ->
        view.accentColor = value?.let { Color(it) }
      }
      Prop("trackColor") { view: AndroidGlassSlider, value: Int? ->
        view.trackColor = value?.let { Color(it) }
      }

      OnViewDidUpdateProps { view: AndroidGlassSlider ->
        view.applyProps()
      }
    }

    View(AndroidGlassBottomTabs::class) {
      Name("AndroidGlassBottomTabs")
      Events("onTabSelected", "onMinimizedChange")

      Prop("minimized") { view: AndroidGlassBottomTabs, value: Boolean? ->
        view.setMinimizedProp(value ?: false)
      }
      Prop("selectedIndex") { view: AndroidGlassBottomTabs, value: Int? ->
        view.selectedIndexProp.value = value ?: 0
      }
      Prop("mostRecentEventCount") { view: AndroidGlassBottomTabs, value: Int? ->
        view.selectedIndexProp.mostRecentEventCount = value ?: 0
      }
      Prop("tabsCount") { view: AndroidGlassBottomTabs, value: Int? ->
        view.tabsCount = value ?: 1
      }
      Prop("accentColor") { view: AndroidGlassBottomTabs, value: Int? ->
        view.accentColor = value?.let { Color(it) }
      }
      Prop("containerColor") { view: AndroidGlassBottomTabs, value: Int? ->
        view.containerColor = value?.let { Color(it) }
      }

      OnViewDidUpdateProps { view: AndroidGlassBottomTabs ->
        view.applyProps()
      }

      ReactChildren()
    }
  }
}

private fun Int?.toColorOr(default: Color): Color = if (this != null) Color(this) else default

/** React children live after the Compose layer; see GlassHostView. */
private inline fun <reified T : GlassHostView> ViewDefinitionBuilder<T>.ReactChildren() {
  GroupView<T> {
    AddChildView { parent, child: View, index ->
      parent.addReactChild(child, index)
    }
    GetChildCount { parent ->
      parent.reactChildCount
    }
    GetChildViewAt { parent, index ->
      parent.getReactChildAt(index)
    }
    RemoveChildView { parent, child: View ->
      parent.removeReactChild(child)
    }
    RemoveChildViewAt { parent, index ->
      parent.removeReactChildAt(index)
    }
  }
}
