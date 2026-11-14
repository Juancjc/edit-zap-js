export const delimiters: Record<string, string> = {
  bold: "*",
  italic: "_",
  strike: "~",
  code: "`",
  monospace: "```",
};
export const safeUrl = (url: string): boolean =>
  /^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(url);
export const escapeHTML = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
// Invisible separators prevent literal user delimiters from becoming formatting tokens.
// WhatsApp does not document a universal backslash escape. JSON is the lossless format.
export const literalText = (text: string): string =>
  text.replace(/(?:https?:\/\/|mailto:)[^\s<>]+|[*_~`]/gi, (token) =>
    token.length > 1 ? token : token + "\u200b",
  );
