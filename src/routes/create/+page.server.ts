import type { Actions } from './$types';

export const actions: Actions = {
	upload: async ({ request }) => {
		const formData = await request.formData();
		const payload = formData.get('nonogram');

		if (!payload || typeof payload !== 'string') {
			return { success: false, error: 'No nonogram data provided' };
		}

		// TODO: persist to database
		console.log('Received nonogram upload (dummy):', payload);

		return { success: true };
	}
};
