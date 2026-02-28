/**
 * Rejects URLs that point to private / loopback / link-local addresses (SSRF protection).
 * Returns true if the URL is safe to use as an external agent endpoint.
 */
export function isSafeUrl(raw: string): boolean {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return false;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

    const hostname = url.hostname.toLowerCase();

    // Block loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;

    // Block link-local (169.254.x.x) and private ranges heuristically
    const privatePatterns = [
        /^10\./,                     // 10.0.0.0/8
        /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
        /^192\.168\./,               // 192.168.0.0/16
        /^169\.254\./,               // link-local
        /^fc00:/i,                   // IPv6 unique local
        /^fe80:/i,                   // IPv6 link-local
        /^0\./,                      // 0.x.x.x
        /^::1$/,                     // IPv6 loopback
        /^metadata\.google\.internal$/i, // GCP metadata
    ];

    return !privatePatterns.some((p) => p.test(hostname));
}

/**
 * Validates that a string is a well-formed absolute URL (http or https).
 */
export function isValidHttpUrl(raw: string): boolean {
    try {
        const url = new URL(raw);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
