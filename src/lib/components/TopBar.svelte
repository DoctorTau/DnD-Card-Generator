<script lang="ts">
	export let showLayout = false;
	export let sheetFootnote = 'a4 210×297mm';
	export let onMakePdf: () => void;
	export let onClearAll: () => void;
	export let onToggleLayout: () => void;
	export let onOpenDialog: () => void;
	export let pdfLoading = false;
</script>

<div class="topbar">
	<div class="topbar-inner">
		<div class="brand" aria-label="Card Forge">
			<svg class="brand-gem" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
				<polygon points="10,1.5 18.5,10 10,18.5 1.5,10" fill="none" stroke="currentColor" stroke-width="1.4"/>
				<polygon points="10,5 15,10 10,15 5,10" fill="currentColor" opacity="0.3"/>
				<polygon points="10,7.5 12.5,10 10,12.5 7.5,10" fill="currentColor" opacity="0.6"/>
			</svg>
			<span class="brand-name">Card Forge</span>
		</div>

		<div class="separator" aria-hidden="true"></div>

		<div class="actions">
			<button
				class="btn pdf-btn"
				class:loading={pdfLoading}
				on:click={onMakePdf}
				disabled={pdfLoading}
				aria-label={pdfLoading ? 'Generating PDF…' : 'Make PDF'}
			>
				{#if pdfLoading}
					<span class="spinner" aria-hidden="true"></span>
				{:else}
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect x="2.5" y="1" width="11" height="14" rx="1.5"/>
						<line x1="5.5" y1="5.5" x2="10.5" y2="5.5"/>
						<line x1="5.5" y1="8.5" x2="10.5" y2="8.5"/>
						<line x1="5.5" y1="11.5" x2="8.5" y2="11.5"/>
					</svg>
				{/if}
				Make PDF
			</button>

			<button
				class="btn icon-btn"
				class:active={showLayout}
				type="button"
				aria-pressed={showLayout}
				aria-label="Layout settings"
				title="Layout settings"
				on:click={onToggleLayout}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
					<path fill="currentColor" d="M4 6h2v2H4V6zm4 0h14v2H8V6zM4 11h8v2H4v-2zm10 0h10v2H14v-2zM4 16h5v2H4v-2zm7 0h13v2H11v-2z"/>
				</svg>
			</button>

			<button class="btn ghost tiny" on:click={onClearAll}>Clear</button>

			<button class="btn cta" type="button" on:click={onOpenDialog}>
				<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
					<line x1="6" y1="1.5" x2="6" y2="10.5"/>
					<line x1="1.5" y1="6" x2="10.5" y2="6"/>
				</svg>
				Add Card
			</button>
		</div>

		<p class="sheet-meta">
			<svg width="5" height="5" viewBox="0 0 6 6" aria-hidden="true" class="meta-gem">
				<polygon points="3,0 6,3 3,6 0,3" fill="currentColor"/>
			</svg>
			{sheetFootnote}
		</p>
	</div>
</div>

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		border-top: 1px solid rgba(201, 168, 76, 0.38);
		border-bottom: 1px solid var(--border);
		backdrop-filter: blur(24px) saturate(200%);
		background: var(--topbar-bg);
	}

	.topbar-inner {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: 14px;
		padding: 10px 20px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.brand-gem {
		color: var(--gold);
		flex-shrink: 0;
		filter: drop-shadow(0 0 4px rgba(201, 168, 76, 0.35));
	}

	.brand-name {
		font-family: 'Alegreya SC', serif;
		font-size: 14px;
		font-weight: 700;
		color: var(--gold);
		letter-spacing: 0.12em;
		line-height: 1;
		opacity: 0.9;
	}

	.separator {
		width: 1px;
		height: 22px;
		background: var(--border);
		flex-shrink: 0;
		opacity: 0.6;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		flex: 1;
	}

	.sheet-meta {
		margin: 0;
		margin-left: auto;
		font-size: 10px;
		color: var(--text-dim);
		display: flex;
		align-items: center;
		gap: 5px;
		line-height: 1.3;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}

	.meta-gem {
		color: var(--gold);
		opacity: 0.4;
		flex-shrink: 0;
	}

	/* ── Buttons ── */
	.btn {
		border: 1px solid var(--border-2);
		background: var(--surface);
		color: var(--text);
		border-radius: var(--radius-sm);
		height: 36px;
		padding: 0 13px;
		font-size: 12.5px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.08s, box-shadow 0.15s;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		letter-spacing: 0.01em;
	}
	.btn:hover { background: var(--surface-2); border-color: var(--gold); color: var(--gold-bright); }
	.btn:active { transform: scale(0.96); }
	.btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
	.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

	.btn.ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}
	.btn.ghost:hover { background: var(--surface); border-color: var(--border-2); color: var(--text); }

	.btn.tiny { height: 30px; padding: 0 10px; font-size: 11.5px; }

	.btn.icon-btn {
		width: 36px;
		height: 36px;
		padding: 0;
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}
	.btn.icon-btn:hover { background: var(--surface-2); border-color: var(--gold); color: var(--gold-bright); }
	.btn.icon-btn.active { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }

	.btn.pdf-btn {
		background: var(--gold-dim);
		border-color: var(--border-2);
		color: var(--gold-bright);
		font-weight: 600;
	}
	.btn.pdf-btn:hover:not(:disabled) {
		background: rgba(201, 168, 76, 0.18);
		border-color: var(--gold);
		box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.07);
	}

	.btn.cta {
		background: linear-gradient(140deg, var(--gold) 0%, var(--gold-bright) 100%);
		color: var(--bg);
		border-color: transparent;
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 0.03em;
		height: 36px;
		padding: 0 16px;
		position: relative;
		overflow: hidden;
	}
	.btn.cta::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
		transform: translateX(-120%);
		transition: transform 0s;
	}
	.btn.cta:hover::after {
		transform: translateX(120%);
		transition: transform 560ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.btn.cta:hover { background: linear-gradient(140deg, var(--gold-bright) 0%, var(--gold) 100%); }

	.spinner {
		width: 12px;
		height: 12px;
		border: 1.5px solid rgba(201, 168, 76, 0.25);
		border-top-color: var(--gold);
		border-radius: 50%;
		animation: spin 600ms linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
</style>
