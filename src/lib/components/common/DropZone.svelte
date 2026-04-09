<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let dzHover = false;
	let fileInput: HTMLInputElement | null = null;

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
	<div class="hint">
		<div class="title">Drag & drop image here or click</div>
		<div class="sub">PNG/JPEG. Max ~50 MB (browser dependent).</div>
	</div>

	<input class="hidden" type="file" accept="image/*" bind:this={fileInput} on:change={onPick} />
</div>

<style>
	/* Reuse local styles expected by the app */
	.dz {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 260px;
		min-height: 120px;
		border: 2px dashed #cbd5e1;
		border-radius: 14px;
		background: #fff;
		cursor: pointer;
		user-select: none;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.08s;
	}
	.dz:hover {
		background: #f8fafc;
	}
	.dz[data-hovering='true'] {
		background: #eef2ff;
		border-color: #6366f1;
		transform: scale(0.998);
	}
	.dz:focus-visible {
		outline: 2px solid #6366f1;
		outline-offset: 2px;
	}
	.hidden {
		display: none;
	}
	.hint {
		text-align: center;
		padding: 12px;
	}
	.hint .title {
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
	}
	.hint .sub {
		font-size: 12px;
		color: #64748b;
		margin-top: 2px;
	}
</style>
