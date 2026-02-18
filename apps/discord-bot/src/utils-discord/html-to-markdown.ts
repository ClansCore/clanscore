/**
 * Converts HTML formatting to Discord Markdown formatting.
 * Discord supports Markdown, not HTML, so we need to convert common HTML tags.
 * 
 * Supported conversions:
 * - <b>, <strong> → **bold**
 * - <i>, <em> → *italic*
 * - <u> → __underline__
 * - <br>, <br/>, <br /> → newline
 * - <p>, </p> → newline
 * - Other HTML tags are removed
 */
export function convertHtmlToDiscordMarkdown(html: string | null | undefined): string {
    if (!html) return "";

    let result = html;

    result = result.replace(/&nbsp;/g, " ");
    result = result.replace(/&amp;/g, "&");
    result = result.replace(/&lt;/g, "<");
    result = result.replace(/&gt;/g, ">");
    result = result.replace(/&quot;/g, '"');
    result = result.replace(/&#39;/g, "'");
    result = result.replace(/&apos;/g, "'");

    result = result.replace(/<br\s*\/?>/gi, "\n");

    result = result.replace(/<p\s*[^>]*>/gi, "");
    result = result.replace(/<\/p>/gi, "\n");

    result = result.replace(/<b\s*[^>]*>(.*?)<\/b>/gi, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? `**${trimmed}**` : "";
    });
    result = result.replace(/<strong\s*[^>]*>(.*?)<\/strong>/gi, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? `**${trimmed}**` : "";
    });

    result = result.replace(/<i\s*[^>]*>(.*?)<\/i>/gi, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : "";
    });
    result = result.replace(/<em\s*[^>]*>(.*?)<\/em>/gi, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : "";
    });

    result = result.replace(/<u\s*[^>]*>(.*?)<\/u>/gi, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? `__${trimmed}__` : "";
    });

    result = result.replace(/<[^>]+>/g, "");

    result = result.replace(/\n{3,}/g, "\n\n");

    result = result.replace(/[ \t]+\n/g, "\n");
    result = result.replace(/\n[ \t]+/g, "\n");

    result = result.trim();

    return result;
}
