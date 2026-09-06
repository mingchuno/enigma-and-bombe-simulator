export function Icon({
  name,
  size = 18,
}: {
  name: "arrow" | "reset" | "play" | "copy" | "close" | "book" | "undo";
  size?: number;
}) {
  const paths = {
    arrow: (
      <>
        <path d="M4 12h15m-6-6 6 6-6 6" />
      </>
    ),
    reset: (
      <>
        <path d="M4 9a8 8 0 1 1 0 7M4 4v5h5" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8Z" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M15 8V3H3v13h5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    book: (
      <>
        <path d="M12 5v15M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" />
      </>
    ),
    undo: (
      <>
        <path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
