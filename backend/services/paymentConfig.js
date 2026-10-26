function credentialsForMode() {
    return {
        // Keep the legacy names working for existing local .env files. This app
        // is test-only, so legacy values are accepted only when the key ID is
        // explicitly a Razorpay test key.
        keyId: (process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID || "").trim(),
        keySecret: (process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "").trim()
    };
}

function hasCredentials() {
    const { keyId, keySecret } = credentialsForMode();
    return Boolean(
        keyId.startsWith("rzp_test_") &&
        keySecret &&
        !/replace|example|your[_ -]?key/i.test(`${keyId} ${keySecret}`)
    );
}

async function currentMode() {
    return "test";
}

async function publicSettings() {
    return { mode: "test", configured: hasCredentials() };
}

module.exports = { credentialsForMode, currentMode, hasCredentials, publicSettings };
