<script lang="ts">
	export let label: string;
	export let value: number;
	export let setValue: (n: number) => void;
	export let min: number;
	export let max: number;

	function onInput(e: Event) {
		const v = Number((e.target as HTMLInputElement).value) || 0;
		setValue(Math.min(max, Math.max(min, v)));
	}
</script>

<div class="wrap">
	<label class="lbl">{label}</label>
	<input type="number" {value} on:input={onInput} />
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
	}
	.lbl {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 4px;
	}
	input {
		border: 1px solid var(--border-2);
		border-radius: 8px;
		padding: 8px 10px;
		font-size: 13px;
		width: 120px;
		background: var(--input-num-bg);
		color: var(--text);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	input:focus {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px var(--gold-dim);
	}
</style>
