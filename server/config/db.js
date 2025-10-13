// DB configuration is primarily handled in server/index.js where DATABASE_URL
// is validated, normalized, or rebuilt from DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME.
// This module can expose helper accessors if other modules want to read masked URL, etc.

export const getDatabaseUrl = () => process.env.DATABASE_URL || '';
export const getMaskedDatabaseUrl = () => {
	const url = getDatabaseUrl();
	if (!url) return '';
	try {
		const u = new URL(url);
		return `mysql://${u.username || 'user'}:***@${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}`;
	} catch {
		return 'INVALID_URL';
	}
};

export default { getDatabaseUrl, getMaskedDatabaseUrl };
