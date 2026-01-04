<script lang="ts">
	type Props = { class: Record<string, string> };
	const { class: className }: Props = $props();
</script>

<span
	class={{
		'icon-[solar--alt-arrow-down-broken]': true,
		'hover:rotate-180': true,
		transition: true,
		'delay-75': true,
		'duration-200': true,
		...className
	}}
></span>
