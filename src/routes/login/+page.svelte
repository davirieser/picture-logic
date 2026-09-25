<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/client';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		loading = true;

		const { error: signInError } = await authClient.signIn.email({
			email,
			password
		});

		loading = false;

		if (signInError) {
			error = signInError.message ?? 'Failed to sign in';
			return;
		}

		goto(resolve('/'));
	}
</script>

<div class="flex min-h-[70dvh] items-center justify-center">
	<form onsubmit={handleSubmit} class="card w-full max-w-sm bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Log in</h2>

			{#if error}
				<div class="alert text-sm alert-error">{error}</div>
			{/if}

			<label class="fieldset-label" for="email">Email</label>
			<input
				id="email"
				type="email"
				required
				bind:value={email}
				class="input-bordered input w-full"
				autocomplete="email"
			/>

			<label class="fieldset-label" for="password">Password</label>
			<input
				id="password"
				type="password"
				required
				bind:value={password}
				class="input-bordered input w-full"
				autocomplete="current-password"
			/>

			<div class="mt-4 card-actions">
				<button type="submit" class="btn w-full btn-primary" disabled={loading}>
					{loading ? 'Logging in…' : 'Log in'}
				</button>
			</div>
		</div>
	</form>
</div>
