package expo.modules.androidglassview

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import expo.modules.androidglassview.backdrop.drawBackdrop
import expo.modules.androidglassview.backdrop.effects.colorFilter
import expo.modules.androidglassview.backdrop.effects.blur
import expo.modules.androidglassview.backdrop.effects.lens
import expo.modules.androidglassview.backdrop.effects.vibrancy
import expo.modules.androidglassview.backdrop.highlight.Highlight
import expo.modules.androidglassview.backdrop.isRenderEffectSupported
import expo.modules.androidglassview.backdrop.shadow.Shadow
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import org.json.JSONArray
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt

internal data class GlassMenuItem(
  val id: String, val title: String, val checked: Boolean = false, val disabled: Boolean = false,
  val destructive: Boolean = false, val separator: Boolean = false, val icon: String = "",
  val compact: Boolean = false, val sectionTitle: String = "", val keepsPresented: Boolean = false,
  val children: List<GlassMenuItem> = emptyList()
)

/** All menu motion and navigation stay on the UI thread, within the content's window. */
@SuppressLint("ViewConstructor")
class AndroidGlassMenuPanel(context: Context, appContext: AppContext) : GlassHostView(context, appContext) {
  internal var items by mutableStateOf<List<GlassMenuItem>>(emptyList())
  internal var expanded by mutableStateOf(false)
  internal var dark by mutableStateOf(false)
  internal var originX by mutableFloatStateOf(1f)
  internal var originY by mutableFloatStateOf(0f)
  internal var rowHeight by mutableFloatStateOf(48f)
  internal var backRequest by mutableIntStateOf(0)
  internal var customHeight by mutableFloatStateOf(0f)
  internal var sourceIcon by mutableStateOf("")
  private val onItemSelected by EventDispatcher()
  private val onClosed by EventDispatcher()
  private val onNavigate by EventDispatcher()
  private val onDismissRequest by EventDispatcher()

  internal fun setItems(json: String) {
    fun parse(array: JSONArray): List<GlassMenuItem> = List(array.length()) { index ->
      val item = array.getJSONObject(index)
      GlassMenuItem(item.optString("id"), item.optString("title"), item.optBoolean("checked"),
        item.optBoolean("disabled"), item.optBoolean("destructive"), item.optBoolean("separator"),
        item.optString("icon"), item.optBoolean("compact"), item.optString("sectionTitle"),
        item.optBoolean("keepsMenuPresented"), item.optJSONArray("children")?.let(::parse) ?: emptyList())
    }
    items = parse(JSONArray(json))
  }

  @Composable
  override fun GlassContent() {
    val opening = remember { Animatable(0f) }
    var started by remember { mutableStateOf(false) }
    var path by remember { mutableStateOf<List<String>>(emptyList()) }
    var retainedPath by remember { mutableStateOf<List<String>>(emptyList()) }
    val disclosure = remember { Animatable(0f) }
    var committed by remember { mutableStateOf(false) }
    val density = LocalDensity.current
    val accessibility = remember { context.getSystemService(Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager }
    var touchExploration by remember { mutableStateOf(accessibility.isTouchExplorationEnabled) }
    DisposableEffect(accessibility) {
      val listener = android.view.accessibility.AccessibilityManager.TouchExplorationStateChangeListener { touchExploration = it }
      accessibility.addTouchExplorationStateChangeListener(listener)
      onDispose { accessibility.removeTouchExplorationStateChangeListener(listener) }
    }
    fun heightOf(item: GlassMenuItem): Float =
      (if (item.compact) rowHeight * .875f else rowHeight) +
        (if (item.title.contains('\n')) 14f * density.fontScale else 0f)
    fun gapOf(item: GlassMenuItem): Float = (if (item.separator) 12f else 0f) +
      (if (item.sectionTitle.isNotEmpty()) 30f * density.fontScale else 0f)
    fun totalHeight(rows: List<GlassMenuItem>): Float = 16f + rows.sumOf { (heightOf(it) + gapOf(it)).toDouble() }.toFloat()
    fun rowTop(rows: List<GlassMenuItem>, index: Int): Float = 8f + rows.take(index).sumOf {
      (heightOf(it) + gapOf(it)).toDouble()
    }.toFloat() + gapOf(rows[index])

    LaunchedEffect(expanded) {
      if (expanded) {
        committed = false
        // Wait for the first measurable frame only. Geometry is rendered from the actual button.
        withFrameNanos { }
        started = true
        opening.animateTo(1f, tween(MenuMotion.OPEN_MS, easing = LinearEasing))
      } else if (started) {
        opening.animateTo(0f, tween(MenuMotion.CLOSE_MS, easing = LinearEasing))
        path = emptyList()
        retainedPath = emptyList()
        disclosure.snapTo(0f)
        onClosed(emptyMap<String, Any>())
      }
    }
    LaunchedEffect(backRequest) { if (backRequest > 0 && path.isNotEmpty()) path = path.dropLast(1) }
    LaunchedEffect(path) {
      onNavigate(mapOf("depth" to path.size))
      if (path.size >= retainedPath.size && path.isNotEmpty()) {
        retainedPath = path
        disclosure.snapTo(0f)
        disclosure.animateTo(1f, spring(.86f, 520f))
      } else {
        disclosure.animateTo(0f, spring(.92f, 620f))
        retainedPath = path
        if (path.isNotEmpty()) disclosure.snapTo(1f)
      }
    }
    LaunchedEffect(items) { committed = false }
    fun choose(item: GlassMenuItem, level: Int) {
      if (!expanded || committed || item.disabled) return
      if (level < path.size) { path = path.take(level); return }
      if (item.children.isNotEmpty()) path = path.take(level) + item.id
      else {
        committed = !item.keepsPresented
        onItemSelected(mapOf("id" to item.id))
      }
    }

    BoxWithConstraints(Modifier.fillMaxSize().pointerInput(expanded) {
      awaitEachGesture {
        val down = awaitFirstDown(requireUnconsumed = false)
        val insideCustom = customHeight > 0f && down.position.x in 0f..size.width.toFloat() &&
          down.position.y in 0f..with(density) { customHeight.dp.toPx() }
        if (!down.isConsumed && expanded && !insideCustom) {
          down.consume()
          onDismissRequest(emptyMap<String, Any>())
        }
      }
    }) {
      val widthDp = maxWidth.value
      val rootHeight = min(if (customHeight > 0f) customHeight else totalHeight(items), maxHeight.value)
      val track = if (expanded) MenuMotion.sample(opening.value) else MenuMotion.closing(opening.value)
      val origin = Offset(widthDp * originX, rootHeight * originY)
      val center = Offset(origin.x + (widthDp / 2 - origin.x) * track.centerX,
        origin.y + (rootHeight / 2 - origin.y) * track.centerY)
      val w = widthDp * track.width
      val h = rootHeight * track.height
      val push = if (retainedPath.isNotEmpty()) disclosure.value.coerceIn(0f, 1f) else 0f
      val surfaceWidth = w * (1f - .028f * push)
      MenuSurface(
        rows = items, width = surfaceWidth, height = h, layoutWidth = widthDp, layoutHeight = rootHeight,
        x = center.x - surfaceWidth / 2, y = center.y - h / 2,
        radius = min(w, h) * track.roundness, textAlpha = track.textAlpha * (1f - .58f * push),
        textLens = track.textLens, textBlur = track.textBlur, material = track.material,
        enabled = expanded, obscured = path.isNotEmpty(), touchExploration = touchExploration,
        sourceAlpha = if (sourceIcon.isEmpty()) 0f else if (expanded) (1f - opening.value * 5f).coerceIn(0f, 1f) else track.sourceAlpha,
        heightOf = ::heightOf, gapOf = ::gapOf,
        onChoose = { choose(it, 0) }, onCollapse = { path = emptyList() }, neck = track.neck,
        sourcePosition = if (expanded) Offset(surfaceWidth / 2, h / 2)
          else Offset(origin.x - center.x + surfaceWidth / 2, origin.y - center.y + h / 2)
      )
      // Keep React children as real Android views: their own responders, state and
      // accessibility remain intact. Only their visual transform follows the native morph.
      if (customHeight > 0f) {
        val generation = reactChildrenGeneration
        SideEffect {
          if (generation >= 0) for (i in 0 until reactChildCount) {
            getReactChildAt(i)?.apply {
              pivotX = 0f; pivotY = 0f
              scaleX = track.width; scaleY = track.height
              translationX = with(density) { (center.x - w / 2).dp.toPx() }
              translationY = with(density) { (center.y - h / 2).dp.toPx() }
              alpha = track.textAlpha.coerceIn(0f, 1f)
            }
          }
        }
      }
      var parentRows = items
      var parentTop = 0f
      retainedPath.forEachIndexed { level, id ->
        val index = parentRows.indexOfFirst { it.id == id }
        if (index >= 0) {
          val parent = parentRows[index]
          val header = parent.copy(checked = false, separator = false, sectionTitle = "", icon = "", compact = false)
          val children = parent.children.mapIndexed { childIndex, item ->
            if (childIndex == 0) item.copy(separator = true) else item
          }
          val rows = listOf(header) + children
          val naturalHeight = totalHeight(rows)
          val targetTop = (parentTop + min(rowTop(parentRows, index) - 24f, 120f))
            .coerceIn(0f, (maxHeight.value - min(naturalHeight, maxHeight.value)).coerceAtLeast(0f))
          val isLast = level == retainedPath.lastIndex
          val progress = if (isLast) disclosure.value.coerceIn(0f, 1.04f) else 1f
          val rowY = parentTop + rowTop(parentRows, index) - 8f
          val top = rowY + (targetTop - rowY) * progress
          val pageHeight = min(naturalHeight, maxHeight.value - targetTop)
          val currentHeight = (heightOf(header) + 16f) + (pageHeight - heightOf(header) - 16f) * progress
          val pageWidth = widthDp * (0.97f + .03f * progress)
          // A separate front surface grows out of its row. The parent remains visible and dimmed.
          MenuSurface(rows, pageWidth, currentHeight, widthDp, pageHeight,
            (widthDp - pageWidth) / 2, top, 31f, 1f, 0f, 0f, progress.coerceIn(0f,1f),
            expanded, level + 1 < path.size, touchExploration, 0f, ::heightOf, ::gapOf,
            onChoose = { if (it.id == header.id) path = path.take(level) else choose(it, level + 1) },
            onCollapse = { path = path.take(level + 1) }, headerId = header.id,
            reveal = progress.coerceIn(0f,1f), overallAlpha = if (expanded) 1f else opening.value)
          parentTop = targetTop
          parentRows = parent.children
        }
      }
    }
  }

  @Composable
  private fun MenuSurface(
    rows: List<GlassMenuItem>, width: Float, height: Float, layoutWidth: Float, layoutHeight: Float,
    x: Float, y: Float, radius: Float, textAlpha: Float, textLens: Float, textBlur: Float,
    material: Float, enabled: Boolean, obscured: Boolean, touchExploration: Boolean, sourceAlpha: Float,
    heightOf: (GlassMenuItem) -> Float, gapOf: (GlassMenuItem) -> Float,
    onChoose: (GlassMenuItem) -> Unit, onCollapse: () -> Unit,
    headerId: String? = null, reveal: Float = 1f, overallAlpha: Float = 1f,
    neck: Float = 0f, sourcePosition: Offset = Offset(width / 2, height / 2)
  ) {
    val density = LocalDensity.current
    val lens = remember { if (Build.VERSION.SDK_INT >= 33) MenuLens() else null }
    val effectsSupported = isRenderEffectSupported()
    val scroll = rememberScrollState()
    var touching by remember { mutableStateOf(false) }
    var hovering by remember { mutableStateOf(false) }
    var active by remember { mutableIntStateOf(-1) }
    var gesture by remember { mutableIntStateOf(0) }
    var targetCenter by remember { mutableFloatStateOf(0f) }
    var targetHeight by remember { mutableFloatStateOf(48f) }
    // Start each touch on its first row, then spring between row-aligned targets.
    val selectedY by key(gesture) { animateFloatAsState(targetCenter, spring(.78f, 950f), label = "selection y") }
    val selectedH by key(gesture) { animateFloatAsState(targetHeight, spring(.82f, 1000f), label = "selection height") }
    var fingerDirection by remember { mutableStateOf(Offset.Zero) }
    val press by animateFloatAsState(if (touching && !obscured) 1f else 0f, spring(.9f, 900f), label = "contact")
    val hasContact = touching && enabled && !obscured && material > .95f
    // Pulling down narrows the glass and lengthens it, with its right edge held in place.
    // The release has a softer spring so it crosses the resting position before settling.
    val pullSpring = if (hasContact) spring<Float>(.86f, 1000f) else spring(.72f, 600f)
    val dragX by animateFloatAsState(if (hasContact) fingerDirection.x else 0f, pullSpring, label = "menu drag x")
    val dragY by animateFloatAsState(if (hasContact) fingerDirection.y else 0f, pullSpring, label = "menu drag y")
    val verticalPull by animateFloatAsState(if (hasContact) abs(fingerDirection.y) else 0f, pullSpring, label = "menu pull deformation")
    val horizontalPull = abs(dragX) * (1f - verticalPull).coerceAtLeast(0f)
    val stretchX = 1f - .025f * verticalPull + .012f * horizontalPull
    val stretchY = 1f + .025f * verticalPull - .012f * horizontalPull
    val alpha by animateFloatAsState(if (touching && active >= 0 && !obscured) 1f else 0f, tween(70), label = "highlight")
    val foreground = if (dark) Color(0xFFF5F5F7) else Color(0xFF202124)
    val fixedLayer = headerId == null
    val surfaceScaleX = (if (fixedLayer) width / layoutWidth else 1f) * stretchX
    val surfaceScaleY = (if (fixedLayer) height / layoutHeight else 1f) * stretchY
    val effectScale = min(surfaceScaleX, surfaceScaleY).coerceAtLeast(.05f)
    val scaleX = if (fixedLayer) 1f else width / layoutWidth
    val scaleY = 1f
    val scrubbing = if (touchExploration) Modifier else Modifier.pointerInput(rows, enabled, obscured, width, height) {
      var touchOrigin = Offset.Zero
      fun update(position: Offset) {
        fingerDirection = Offset(
          ((position.x - touchOrigin.x) / (size.width * .65f)).coerceIn(-1f, 1f),
          ((position.y - touchOrigin.y) / (size.height * .65f)).coerceIn(-1f, 1f))
        hovering = position.x in 0f..size.width.toFloat() && position.y in 0f..size.height.toFloat()
        val inset = with(density) { 8.dp.toPx() }
        val insideRows = position.x >= inset && position.x < size.width - inset
        val localY = position.y / scaleY + scroll.value
        var top = with(density) { 8.dp.toPx() }
        active = -1
        rows.forEachIndexed { i, item ->
          top += with(density) { gapOf(item).dp.toPx() }
          val h = with(density) { heightOf(item).dp.toPx() }
          val center = top + h / 2 - scroll.value
          if (!item.disabled && hovering && insideRows && localY >= top && localY < top + h) {
            active = i
            // The highlight belongs to the row; only the glass surface follows the finger.
            targetCenter = center
            targetHeight = h - inset
          }
          top += h
        }
      }
      awaitEachGesture {
        val down = awaitFirstDown(requireUnconsumed = false)
        down.consume()
        if (!enabled) return@awaitEachGesture
        gesture++
        touching = true
        touchOrigin = down.position
        update(down.position)
        try {
          while (true) {
            val event = awaitPointerEvent()
            val change = event.changes.firstOrNull { it.id == down.id } ?: break
            if (change.isConsumed) break
            update(change.position)
            if (!change.pressed) {
              if (hovering && obscured) onCollapse()
              else if (active in rows.indices) onChoose(rows[active])
              change.consume()
              break
            }
            val edge = with(density) { 24.dp.toPx() }
            if (change.position.y > size.height - edge) scroll.dispatchRawDelta(edge / 6)
            else if (change.position.y < edge) scroll.dispatchRawDelta(-edge / 6)
            change.consume()
          }
        } finally { touching = false; hovering = false; active = -1 }
      }
    }
    val menuGlass = remember(dark) { GlassState().apply { this.dark = this@AndroidGlassMenuPanel.dark } }
    val localRadius = radius / effectScale
    val shape = RoundedCornerShape(localRadius.coerceAtLeast(0f).dp)
    val silhouette = if (neck > .001f) MenuDropShape(localRadius.dp, neck) else shape
    Box(Modifier.offset {
      IntOffset(with(density) { (x + width * (1f - stretchX) + dragX * 7f * (1f - verticalPull).coerceAtLeast(0f)).dp.toPx() }.roundToInt(),
        with(density) { (y + dragY * 8f).dp.toPx() }.roundToInt())
    }
      .requiredSize((if(fixedLayer) layoutWidth else width).coerceAtLeast(1f).dp,
        (if(fixedLayer) layoutHeight else height).coerceAtLeast(1f).dp)
      .drawBackdrop(backdrop = backdrop, shape = { shape }, clipToShape = false, layerBlock = {
        transformOrigin = TransformOrigin(0f,0f)
        this.scaleX = surfaceScaleX; this.scaleY = surfaceScaleY
        this.alpha = overallAlpha; this.shape = silhouette; clip = true
      }, effects = {
        glassEffects(menuGlass, effectScale, material, press)
      }, highlight = { menuGlass.rim.copy(alpha = menuGlass.rim.alpha + press * .25f) },
      shadow = { menuGlass.dropShadow },
      onDrawSurface = { glassSurface(menuGlass, effectsSupported) }
      )
      .then(scrubbing)
      .clip(silhouette)
      .drawWithContent {
        drawContent()
        val stroke = (.65f / effectScale).dp.toPx()
        val border = Brush.linearGradient(listOf(Color.White.copy(alpha = .10f + press * .12f),
          Color.Transparent, Color(0xFF8CDFFF).copy(alpha = .055f + press * .28f)))
        if (neck > .001f) drawOutline(silhouette.createOutline(size,layoutDirection,this), border, style=Stroke(stroke))
        else drawRoundRect(border, topLeft = Offset(stroke/2,stroke/2), size = Size(size.width-stroke,size.height-stroke),
          cornerRadius = CornerRadius((localRadius.dp.toPx()-stroke/2).coerceAtLeast(0f)), style = Stroke(stroke))
      }) {
      Box(Modifier.wrapContentSize(Alignment.TopStart, unbounded = true).requiredSize(layoutWidth.dp, layoutHeight.dp).graphicsLayer {
        transformOrigin = TransformOrigin(0f,0f)
        this.scaleX = scaleX; this.scaleY = scaleY
        this.alpha = textAlpha
        if (Build.VERSION.SDK_INT >= 33) renderEffect = lens?.update(size.width,size.height,textLens,with(density){(textBlur * .45f).dp.toPx()})
      }) {
        Canvas(Modifier.fillMaxSize()) {
          if (touching && active >= 0 && !obscured && alpha > .001f) {
            val pad = 8.dp.toPx()
            drawRoundRect(foreground.copy(alpha = (if(dark) .19f else .10f) * alpha),
              Offset(pad, selectedY-selectedH/2), Size(size.width-pad*2,selectedH), CornerRadius(22.dp.toPx()))
          }
        }
        Column(Modifier.fillMaxSize().verticalScroll(scroll, enabled = touchExploration).padding(8.dp)) {
          rows.forEachIndexed { index, item ->
            val childAlpha = if (headerId != null && index > 0) ((reveal-.12f)/.62f).coerceIn(0f,1f) else 1f
            if (item.separator) Canvas(Modifier.fillMaxWidth().height(12.dp).padding(horizontal=16.dp).graphicsLayer { this.alpha=childAlpha }) {
              drawLine(foreground.copy(alpha=.09f),Offset(0f,size.height/2),Offset(size.width,size.height/2),.6f.dp.toPx())
            }
            if (item.sectionTitle.isNotEmpty()) Box(Modifier.fillMaxWidth().height((30*density.fontScale).dp).padding(start=34.dp),contentAlignment=Alignment.CenterStart) {
              BasicText(item.sectionTitle,style=TextStyle(color=foreground.copy(alpha=.48f),fontSize=13.sp))
            }
            Row(Modifier.fillMaxWidth().height(heightOf(item).dp).graphicsLayer { this.alpha=childAlpha }
              .semantics(mergeDescendants=true) {
                role=Role.Button; selected=item.checked
                if(item.disabled) disabled()
                onClick(label=item.title) { if(item.disabled) false else { if(obscured) onCollapse() else onChoose(item); true } }
              }.padding(start=12.dp,end=16.dp), verticalAlignment=Alignment.CenterVertically) {
              val color=(if(item.destructive) Color(0xFFFF545B) else foreground).copy(alpha=if(item.disabled) .35f else 1f)
              val isHeader=item.id==headerId
              val headerProgress = if (isHeader) reveal.coerceIn(0f,1f) else 0f
              // Preserve the source row's leading slot, then collapse it into the header inset.
              if (isHeader) Spacer(Modifier.width((22f * (1f-headerProgress)).dp))
              else Canvas(Modifier.width(22.dp).height(20.dp).clearAndSetSemantics {}) {
                if(item.checked) drawMenuIcon("check",color)
              }
              if(item.icon.isNotEmpty()) Canvas(Modifier.padding(end=14.dp).size(20.dp).clearAndSetSemantics {}) { drawMenuIcon(item.icon,color) }
              BasicText(item.title,Modifier.weight(1f),style=TextStyle(color=color,fontSize=16.5f.sp,lineHeight=20.sp,
                fontWeight=FontWeight((400f + 100f * headerProgress).roundToInt())),maxLines=2,overflow=TextOverflow.Ellipsis)
              if(item.children.isNotEmpty()) Canvas(Modifier.padding(start=12.dp)
                .width((8f + 4f * headerProgress).dp).height(16.dp)
                .graphicsLayer { rotationZ=90f * headerProgress }.clearAndSetSemantics {}) {
                drawMenuIcon("chevron",color)
              }
            }
          }
        }
      }
      if(sourceAlpha > .001f) Canvas(Modifier.offset((sourcePosition.x/surfaceScaleX-10).dp,(sourcePosition.y/surfaceScaleY-10).dp)
        .size(20.dp).graphicsLayer {
          this.alpha=sourceAlpha; this.scaleX=1f/surfaceScaleX; this.scaleY=1f/surfaceScaleY
        }) {
        drawMenuIcon(sourceIcon,foreground)
      }
    }
  }
}
