<script lang="ts">
	import { ENHANCED_BORDER_SPACING } from '$lib/storable';

	let dialog: HTMLDialogElement;

	export function show() {
		dialog.showModal();
	}

	export function close() {
		dialog.close();
	}

	function handleSpacingInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const value = Number(target.value);

		if (value > 0) {
			$ENHANCED_BORDER_SPACING = value;
		}
	}
</script>

<dialog bind:this={dialog} class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"> ✕ </button>
		</form>

		<h3 class="text-lg font-bold">Settings</h3>

		<div class="mt-4 flex flex-col gap-4">
			<label class="form-control w-full">
				<div class="label">
					<span class="label-text">Enhanced border spacing</span>
				</div>
				<input
					type="number"
					min="1"
					step="1"
					class="input-bordered input w-full"
					value={$ENHANCED_BORDER_SPACING}
					oninput={handleSpacingInput}
				/>
				<div class="label">
					<span class="label-text-alt">Draw a thick border every N cells in the grid</span>
				</div>
			</label>
		</div>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
