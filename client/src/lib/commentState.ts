export interface CommentEntry {
  text: string;
  user: string;
  date: string;
}

export interface CommentData {
  current: CommentEntry | null;
  history: CommentEntry[];
}

export function sameCommentMap(
  left: Record<string, CommentData>,
  right: Record<string, CommentData>
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(key => {
    const current = left[key];
    const next = right[key];
    if (
      !next ||
      current.current?.text !== next.current?.text ||
      current.current?.user !== next.current?.user ||
      current.current?.date !== next.current?.date
    )
      return false;
    if (current.history.length !== next.history.length) return false;
    return current.history.every((entry, index) => {
      const candidate = next.history[index];
      return (
        entry.text === candidate?.text &&
        entry.user === candidate?.user &&
        entry.date === candidate?.date
      );
    });
  });
}
