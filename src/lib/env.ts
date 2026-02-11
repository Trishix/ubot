export const validateEnv = () => {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'GITHUB_TOKEN',
        'FREE_API_KEY_1'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`❌ Missing Environment Variables: ${missing.join(', ')}`);
    }

    // Basic format validation
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://')) {
        throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
    }

    return true;
};
