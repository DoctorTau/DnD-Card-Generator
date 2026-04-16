<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** Toolbar row: short height, solid border, optional copy overrides */
	export let compact = false;
	export let line1: string | undefined = undefined;
	export let line2: string | undefined = undefined;
	export let hideLine2 = false;

	let dzHover = false;
	let fileInput: HTMLInputElement | null = null;

	$: titleText = line1 ?? 'Drop image or click to browse';
	$: subText = hideLine2 ? null : (line2 ?? 'PNG · JPEG · WebP — up to 50 MB');

	function onPick(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) dispatch('file', { file: f });
	}

	function onDrop(e: DragEvent) {
		dzHover = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) dispatch('file', { file: f });
	}
</script>

<div
	class="dz"
	class:compact
	data-hovering={dzHover}
	on:dragover|preventDefault={() => (dzHover = true)}
	on:dragleave={() => (dzHover = false)}
	on:drop|preventDefault={onDrop}
	on:click={() => fileInput?.click()}
	role="button"
	tabindex="0"
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput?.click()}
	aria-label="Upload image"
>
	<div class="hint" class:compact>
		<div class="icon">🖼</div>
		<div class="text-block">
			<div class="title">{titleText}</div>
			{#if subText}
				<div class="sub">{subText}</div>
			{/if}
		</div>
	</div>

	<input class="hidden" type="file" accept="image/*" bind:this={fileInput} on:change={onPick} on:click|stopPropagation />
</div>

<style>
	.dz {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 260px;
		min-height: 120px;
		border: 2px dashed var(--border-2);
		border-radius: 14px;
		background: var(--dz-bg);
		cursor: pointer;
		user-select: none;
		transition:
			background 0.15s,
			border-color 0.2s,
			box-shadow 0.2s,
			transform 0.08s;
		position: relative;
		overflow: hidden;
	}
	.dz::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse 70% 60% at 50% 50%, var(--gold-dim) 0%, transparent 70%);
		pointer-events: none;
	}
	.dz:hover {
		background: var(--dz-bg-hover);
		border-color: var(--border-2);
		box-shadow: 0 0 20px var(--gold-dim);
	}
	.dz[data-hovering='true'] {
		background: var(--gold-dim);
		border-color: var(--gold);
		box-shadow: 0 0 30px var(--gold-dim);
		transform: scale(0.999);
	}
	.dz.compact {
		min-width: 0;
		width: 100%;
		min-height: 40px;
		height: 40px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}
	.dz.compact::before {
		opacity: 0.5;
	}
	.dz.compact:hover {
		box-shadow: none;
	}
	.dz.compact[data-hovering='true'] {
		transform: none;
	}
	.dz:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
	.hidden {
		display: none;
	}
	.hint {
		text-align: center;
		padding: 16px;
		position: relative;
	}
	.hint:not(.compact) {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.hint.compact {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		text-align: left;
		padding: 0 12px;
		width: 100%;
		height: 100%;
	}
	.text-block {
		min-width: 0;
	}
	.hint.compact .text-block {
		flex: 1;
	}
	.icon {
		font-size: 28px;
		margin-bottom: 8px;
		opacity: 0.7;
	}
	.hint.compact .icon {
		font-size: 18px;
		margin-bottom: 0;
		flex-shrink: 0;
	}
	.hint .title {
		font-size: 13px;
		font-weight: 600;
		color: var(--gold);
		letter-spacing: 0.02em;
	}
	.hint.compact .title {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.hint .sub {
		font-size: 11px;
		color: var(--dz-sub);
		margin-top: 3px;
	}
</style>
