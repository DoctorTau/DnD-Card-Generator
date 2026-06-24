<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let src: string; // original image data URL
	export let aspect = 63.5 / 88.9; // crop frame width / height

	const dispatch = createEventDispatcher<{ crop: string }>();

	// Frame is fit into a max box; keeps a sensible size for both orientations.
	const MAX_W = 320;
	const MAX_H = 340;
	$: frameW = aspect >= 1 ? MAX_W : Math.round(MAX_H * aspect);
	$: frameH = aspect >= 1 ? Math.round(MAX_W / aspect) : MAX_H;

	let img: HTMLImageElement | null = null;
	let nw = 0;
	let nh = 0;
	let baseScale = 1; // "cover" fit scale
	let zoom = 1; // user multiplier (>= 1)
	let tx = 0;
	let ty = 0;
	let prevScale = 1;

	let dragging = false;
	let startX = 0;
	let startY = 0;
	let startTx = 0;
	let startTy = 0;

	$: dispScale = baseScale * zoom;
	$: dispW = nw * dispScale;
	$: dispH = nh * dispScale;

	function loadImage(s: string) {
		const im = new Image();
		im.onload = () => {
			img = im;
			nw = im.naturalWidth;
			nh = im.naturalHeight;
			fit();
			emit();
		};
		im.src = s;
	}
	$: if (src) loadImage(src);

	// Refit when the frame aspect changes (e.g. orientation toggled).
	let lastAspect = aspect;
	$: if (img && aspect !== lastAspect) {
		lastAspect = aspect;
		fit();
		emit();
	}

	function fit() {
		baseScale = Math.max(frameW / nw, frameH / nh);
		zoom = 1;
		prevScale = baseScale;
		tx = (frameW - nw * baseScale) / 2;
		ty = (frameH - nh * baseScale) / 2;
		clamp();
	}

	function clamp() {
		// Compute size locally — the reactive dispW/dispH may be stale when
		// this is called synchronously (e.g. right after the image loads).
		const dW = nw * baseScale * zoom;
		const dH = nh * baseScale * zoom;
		tx = Math.min(0, Math.max(frameW - dW, tx));
		ty = Math.min(0, Math.max(frameH - dH, ty));
	}

	function onDown(e: PointerEvent) {
		if (!img) return;
		dragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startTx = tx;
		startTy = ty;
		(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		tx = startTx + (e.clientX - startX);
		ty = startTy + (e.clientY - startY);
		clamp();
	}
	function onUp() {
		if (!dragging) return;
		dragging = false;
		emit();
	}

	function onZoom() {
		// Zoom about the frame centre so the framed subject stays put.
		const newScale = baseScale * zoom;
		const cx = (frameW / 2 - tx) / prevScale;
		const cy = (frameH / 2 - ty) / prevScale;
		tx = frameW / 2 - cx * newScale;
		ty = frameH / 2 - cy * newScale;
		prevScale = newScale;
		clamp();
		emit();
	}

	function emit() {
		if (!img || !nw) return;
		const scale = baseScale * zoom; // compute locally (avoid stale reactive)
		const sx = -tx / scale;
		const sy = -ty / scale;
		const sw = frameW / scale;
		const sh = frameH / scale;
		const outW = Math.max(1, Math.round(sw));
		const outH = Math.max(1, Math.round(sh));
		const canvas = document.createElement('canvas');
		canvas.width = outW;
		canvas.height = outH;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
		dispatch('crop', canvas.toDataURL('image/png'));
	}
</script>

<div class="cropper">
	<div
		class="frame"
		style="width:{frameW}px;height:{frameH}px"
		on:pointerdown={onDown}
		on:pointermove={onMove}
		on:pointerup={onUp}
		on:pointercancel={onUp}
		role="presentation"
	>
		{#if img}
			<img
				src={img.src}
				alt=""
				draggable="false"
				style="width:{dispW}px;height:{dispH}px;transform:translate({tx}px,{ty}px)"
			/>
		{/if}
		<div class="grid-overlay" aria-hidden="true"></div>
	</div>

	<div class="controls">
		<span class="zoom-ico" aria-hidden="true">−</span>
		<input
			type="range"
			min="1"
			max="4"
			step="0.01"
			bind:value={zoom}
			on:input={onZoom}
			aria-label="Zoom"
		/>
		<span class="zoom-ico" aria-hidden="true">+</span>
	</div>
	<p class="hint">Drag to reposition · slide to zoom</p>
</div>

<style>
	.cropper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	.frame {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-2);
		background: var(--bg-mid);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}
	.frame:active {
		cursor: grabbing;
	}
	.frame img {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		max-width: none;
		pointer-events: none;
	}
	.grid-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(to right, rgba(255, 255, 255, 0.18) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
		background-size: 33.33% 33.33%;
		box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.5);
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		max-width: 320px;
	}
	.controls input[type='range'] {
		flex: 1;
		accent-color: var(--gold);
		cursor: pointer;
	}
	.zoom-ico {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-muted);
		width: 12px;
		text-align: center;
	}
	.hint {
		margin: 0;
		font-size: 10.5px;
		color: var(--text-dim);
		text-align: center;
	}
</style>
