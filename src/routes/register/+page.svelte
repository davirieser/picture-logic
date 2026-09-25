<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/client';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;

		const { error: signUpError } = await authClient.signUp.email({
			name,
			email,
			password
		});

		loading = false;

		if (signUpError) {
			error = signUpError.message ?? 'Failed to register';
			return;
		}

		goto(resolve('/'));
	}
</script>

<svelte:head>
	<title>Register</title>
</svelte:head>

<div class="flex min-h-[70dvh] items-center justify-center">
	<form onsubmit={handleSubmit} class="card w-full max-w-sm bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Create an account</h2>

			{#if error}
				<div class="alert text-sm alert-error">{error}</div>
			{/if}

			<label class="fieldset-label" for="name">Name</label>
			<input
				id="name"
				type="text"
				required
				bind:value={name}
				class="input-bordered input w-full"
				autocomplete="name"
			/>

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
				minlength="8"
				bind:value={password}
				class="input-bordered input w-full"
				autocomplete="new-password"
			/>

			<label class="fieldset-label" for="confirm-password">Confirm password</label>
			<input
				id="confirm-password"
				type="password"
				required
				minlength="8"
				bind:value={confirmPassword}
				class="input-bordered input w-full"
				autocomplete="new-password"
			/>

			<div class="mt-4 card-actions flex-col">
				<button type="submit" class="btn w-full btn-primary" disabled={loading}>
					{#if loading}
						<span class="loading loading-sm loading-spinner"></span>
					{/if}
					Register
				</button>

				<p class="text-center text-sm">
					Already have an account?
					<a href={resolve('/login')} class="link link-primary">Log in</a>
				</p>
			</div>
		</div>
	</form>
</div>
