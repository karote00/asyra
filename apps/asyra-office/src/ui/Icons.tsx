export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    home: 'M3 10 12 3l9 7M5 9v12h14V9M10 21v-7h4v7',
    pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
    people:
      'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M18 5a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-3.9',
    cup: 'M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 9h2a3 3 0 0 1 0 6h-2M7 2v3M12 2v3M3 22h16',
    leaf: 'M20 3C8 2 2 7 5 16c8 5 16-2 15-13ZM4 21l11-11',
    table: 'M3 6h18v4H3ZM5 10v11M19 10v11M8 10v6M16 10v6',
    sofa: 'M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M3 11h3v5h12v-5h3v9H3ZM5 20v2M19 20v2',
    logs: 'M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5',
    tasks: 'M9 12l2 2 4-5M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9M10 21h4',
    arrow: 'm9 6 6 6-6 6',
    close: 'm6 6 12 12M6 18 18 6',
    rotate: 'M4 10a8 8 0 1 1 0 5M4 4v6h6',
    expand: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14'
  }
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
      <path d={paths[name] ?? paths.home} />
    </svg>
  )
}
