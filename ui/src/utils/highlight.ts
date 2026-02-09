
import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml'; // This includes HTML
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';

// Register languages
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);

// ANSI color codes
const COLORS = {
    keyword: '\x1b[95m',      // Bright Magenta
    built_in: '\x1b[96m',     // Bright Cyan
    type: '\x1b[96m',         // Bright Cyan
    literal: '\x1b[95m',      // Bright Magenta
    number: '\x1b[93m',       // Bright Yellow
    string: '\x1b[92m',       // Bright Green
    regexp: '\x1b[91m',       // Bright Red
    symbol: '\x1b[95m',       // Bright Magenta
    class: '\x1b[93m',        // Bright Yellow
    function: '\x1b[94m',     // Bright Blue
    title: '\x1b[94m',        // Bright Blue
    params: '\x1b[97m',       // Bright White
    comment: '\x1b[90m',      // Bright Black (Grey)
    doctag: '\x1b[96m',       // Bright Cyan
    meta: '\x1b[90m',         // Bright Black (Grey)
    tag: '\x1b[96m',          // Bright Cyan
    attribute: '\x1b[93m',    // Bright Yellow
    variable: '\x1b[97m',     // Bright White
    section: '\x1b[1;94m',    // Bold Bright Blue
    name: '\x1b[1;94m',       // Bold Bright Blue
    subst: '\x1b[97m',        // Bright White
    reset: '\x1b[0m',
};

// Map hljs classes to ANSI colors
const CLASS_MAPPING: Record<string, string> = {
    'hljs-keyword': COLORS.keyword,
    'hljs-built_in': COLORS.built_in,
    'hljs-type': COLORS.type,
    'hljs-literal': COLORS.literal,
    'hljs-number': COLORS.number,
    'hljs-string': COLORS.string,
    'hljs-regexp': COLORS.regexp,
    'hljs-symbol': COLORS.symbol,
    'hljs-class': COLORS.class,
    'hljs-function': COLORS.function,
    'hljs-title': COLORS.title,
    'hljs-params': COLORS.params,
    'hljs-comment': COLORS.comment,
    'hljs-doctag': COLORS.doctag,
    'hljs-meta': COLORS.meta,
    'hljs-tag': COLORS.tag,
    'hljs-attribute': COLORS.attribute,
    'hljs-variable': COLORS.variable,
    'hljs-section': COLORS.section,
    'hljs-name': COLORS.name,
    'hljs-subst': COLORS.subst,
};

/**
 * Highlights a block of code and returns ANSI-formatted string.
 * @param code The code to highlight.
 * @param language The language identifier (e.g., 'python', 'rust').
 * @returns ANSI-formatted string.
 */
export function highlightCodeToAnsi(code: string, language: string): string {
    try {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        if (validLanguage === 'plaintext') {
            return code; // Return as-is if easier or language not found
        }

        const result = hljs.highlight(code, { language: validLanguage });
        let html = result.value;

        // Parse HTML and replace spans with ANSI codes
        // This is a naive regex replacement, but sufficient for simple highlighting.
        // We match <span class="hljs-X">...</span>
        // IMPORTANT: Nested spans are possible. Regex is tricky.
        // However, hljs output is usually flat or simply nested.
        // A better approach is to use a parser or simply iterate tokens if hljs exposed them easily.
        // hljs DOES expose an emitter API, but the simple highlight returns HTML string.

        // Let's use a simpler approach: process the HTML string.
        // To handle nesting correctly, one would need a stack.
        // But for a simple terminal output, maybe regex is okay if we assume minimal nesting or handle it?
        // Actually, simple regex replacement of <span class="..."> with Color and </span> with Reset might FAIL on nested spans (resetting too early).
        // E.g. <span class="string">"foo <span class="subst">bar</span> baz"</span>
        // "foo " -> Green. "bar" -> White. " baz" -> Reset (oops, should be Green).

        // Let's try to do a robustreplacement using a stack
        let output = '';
        let colorStack: string[] = [COLORS.reset];

        // Simple parser
        const regex = /<\/?span[^>]*>|[^<]+/g;
        let match;

        while ((match = regex.exec(html)) !== null) {
            const part = match[0];
            if (part.startsWith('<span')) {
                const classMatch = /class="([^"]*)"/.exec(part);
                if (classMatch && classMatch[1]) {
                    // Find the color for the class(es)
                    // Classes can be multiple: "hljs-keyword" or "hljs-comment"
                    const classes = classMatch[1].split(' ');
                    let colorCode = COLORS.reset;
                    for (const cls of classes) {
                        if (CLASS_MAPPING[cls]) {
                            colorCode = CLASS_MAPPING[cls];
                            break;
                        }
                    }
                    // Push to stack and apply
                    colorStack.push(colorCode);
                    output += colorCode;
                } else {
                    colorStack.push(COLORS.reset);
                }
            } else if (part.startsWith('</span')) {
                // Pop from stack
                if (colorStack.length > 1) {
                    colorStack.pop();
                    // Restore previous color
                    output += colorStack[colorStack.length - 1];
                }
            } else {
                // Text content
                // Decode HTML entities (basic ones)
                const text = part
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                output += text;
            }
        }

        return output + COLORS.reset;

    } catch (error) {
        console.error("Highlight error:", error);
        return code; // Fallback to plain text
    }
}
