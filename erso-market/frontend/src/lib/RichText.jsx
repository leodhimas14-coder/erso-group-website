/**
 * Shows a page text written in the admin panel. Kept deliberately simple and
 * safe (no HTML): a line starting with "## " is a heading, blank lines
 * separate paragraphs.
 */
export default function RichText({ text }) {
  const blocks = String(text || '').split(/\n{2,}|\n(?=## )/);
  return blocks.map((block, i) => {
    const t = block.trim();
    if (!t) return null;
    if (t.startsWith('## ')) {
      const [head, ...rest] = t.split('\n');
      return (
        <div key={i}>
          <h3>{head.slice(3)}</h3>
          {rest.length > 0 && <p>{rest.join('\n')}</p>}
        </div>
      );
    }
    return <p key={i} className="pre-line">{t}</p>;
  });
}
