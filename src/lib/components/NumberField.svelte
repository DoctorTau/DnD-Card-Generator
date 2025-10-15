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
		font-size: 12px;
	}
	input {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 8px 10px;
		font-size: 14px;
		width: 120px;
	}
</style>
