import { browser } from '$app/environment';
import { writable } from 'svelte/store'
import { PALETTES, type Palette } from './util';

// https://github.com/babichjacob/svelte-localstorage/blob/main/projects/svelte-localstorage/browser.js

/**
 * @template T
 * @param {string} key What key in localStorage to synchronize with
 * @param {T} initial The initial value of the writable store
 * @param {object} param2 How to serialize and deserialize the Item
 * @param {function(T): string} [param2.serialize] How to create a string representation of the Item to store in localStorage. You can also implement compression here.
 * @param {function(string): T} [param2.deserialize] How to convert the string representation in localStorage to an Item. You can also implement decompression here.
 * @returns {import("svelte/store").Writable<T>} A writable store that synchronizes with localStorage
 */
export function localStorageWritable<T>(
   key: string,
   initial: T,
   { serialize = JSON.stringify, deserialize = JSON.parse }: { serialize?: (arg0: T) => string; deserialize?: (arg0: string) => T; } = {}
): import("svelte/store").Writable<T> {
	let currentValue = initial;

	if (!browser)
		return writable(initial);

	const syncCurrentValue = (setStore: (_: T) => void, value: T) => {
		setStore(value);
		currentValue = value;
	};

	const parseFromLocalStorage = (localValue: string | null) => {
		if (localValue === null) return initial;

		try {
			return deserialize(localValue);
		} catch (error) {
			console.error(
				`localStorage's value for \`${key}\` (\`${localValue}\`) could not be deserialized with ${deserialize} because of ${error}, so the initial value \`${initial}\` will be used instead`
			);
			return initial;
		}
	};

	const { set: setStore, subscribe } = writable(initial, (setStore) => {
		let localStorageValue: string | null = null;
		try {
			localStorageValue = localStorage.getItem(key);
		} catch (error) {
			console.error(
				`the \`${key}\` store's value could not be restored from localStorage because of ${error}, so the initial value \`${initial}\` will be used instead`
			);
		}

		syncCurrentValue(setStore, parseFromLocalStorage(localStorageValue));

		const setFromStorageEvents = (event: StorageEvent) => {
			if (event.key !== key)
				return;

			syncCurrentValue(setStore, parseFromLocalStorage(event.newValue));
		};
		window.addEventListener("storage", setFromStorageEvents);
		return () => window.removeEventListener("storage", setFromStorageEvents);
	});

	const set = (value: T) => {
		syncCurrentValue(setStore, value);

		try {
			const serialized = serialize(value);

			try {
				localStorage.setItem(key, serialized);
			} catch (error) {
				console.error(
					`the \`${key}\` store's new value \`${value}\` (which serialized to \`${serialized}\`) could not be persisted to localStorage because of ${error}`
				);
			}
		} catch (error) {
			console.error(
				`the \`${key}\` store was set to \`${value}\`, but this could not be serialized with ${serialize} because of ${error}, so it won't be persisted to localStorage`
			);
		}
	};

	const update = (fn: (_: T) => T) => {
		set(fn(currentValue));
	};

	return { set, subscribe, update };
};

export const THEME = localStorageWritable("Theme", false);
const DEFAULT_PALETTE : Palette = "stone";
export const PALETTE = localStorageWritable<Palette>("Palette", DEFAULT_PALETTE, {
	serialize: _ => _,
	deserialize: v => {
		console.log(v);
		if ((PALETTES as unknown as string[]).includes(v))
			return v as Palette;
		return DEFAULT_PALETTE;
	}
});
