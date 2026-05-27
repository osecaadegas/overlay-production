import { createClient } from '@supabase/supabase-js';

let supabaseClient;
let initializePromise;

function normalizeEnvValue(value) {
	if (typeof value !== 'string') {
		return null;
	}

	const normalized = value.trim().replace(/^['\"]|['\"]$/g, '');

	if (!normalized || normalized === 'undefined' || normalized === 'null') {
		return null;
	}

	return normalized;
}

function normalizeSupabaseUrl(value) {
	const normalized = normalizeEnvValue(value);

	if (!normalized) {
		return null;
	}

	return normalized
		.replace(/\/(?:rest|auth|storage|realtime|functions|graphql)\/v1\/?$/i, '')
		.replace(/\/+$/g, '');
}

function getBuildTimeConfig() {
	const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
	const supabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

	if (!supabaseUrl || !supabaseAnonKey) {
		return null;
	}

	return { supabaseUrl, supabaseAnonKey };
}

async function getRuntimeConfig() {
	const response = await fetch('/api/config', {
		cache: 'no-store',
		headers: {
			Accept: 'application/json',
		},
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.error || 'Failed to load runtime Supabase config.');
	}

	const supabaseUrl = normalizeSupabaseUrl(payload.supabaseUrl);
	const supabaseAnonKey = normalizeEnvValue(payload.supabaseAnonKey);

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error('Runtime Supabase config is incomplete.');
	}

	return { supabaseUrl, supabaseAnonKey };
}

function getSupabaseClient() {
	if (!supabaseClient) {
		throw new Error('Supabase client has not been initialized.');
	}

	return supabaseClient;
}

export async function initializeSupabase() {
	if (supabaseClient) {
		return supabaseClient;
	}

	if (!initializePromise) {
		initializePromise = (async () => {
			const config = getBuildTimeConfig() || await getRuntimeConfig();
			supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
			return supabaseClient;
		})().catch((error) => {
			initializePromise = undefined;
			throw error;
		});
	}

	return initializePromise;
}

export const supabase = new Proxy(
	{},
	{
		get(_target, property) {
			const client = getSupabaseClient();
			const value = Reflect.get(client, property, client);
			return typeof value === 'function' ? value.bind(client) : value;
		},
	}
);

export default supabase;
