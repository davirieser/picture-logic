<script lang="ts">
    import { Nonogram } from "$lib/solver";
	import { onMount } from "svelte";
	import { init } from "z3-solver";

    const nonogram = $state(new Nonogram([[1,2,3], [1,2], [3], []], [[1,2,3], [1,2], [2,3]]));

    const greet = async () => {
		const { Context } = await init();
		const ctx = Context('main');

		const start = performance.now();

		const result = await nonogram.solve(ctx);
		if (result !== 'unsat')
			console.log(result.cells);

		const end = performance.now();
		const elapsed = end - start;

		console.log(`Elapsed time: ${elapsed.toFixed(2)}ms`);
    }
</script>

<button onclick={greet}>click me</button>

<style>
	button {
		font-size: 2em;
	}
</style>
