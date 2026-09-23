// A small, dependency-free icon set. Every icon is a 24x24 stroked path drawn
// in currentColor, so an icon always matches the colour of the text beside it.
const STROKED = {
  capsule: ['M10.5 20.5 20.5 10.5a5 5 0 1 0-7-7L3.5 13.5a5 5 0 1 0 7 7Z', 'm8.5 8.5 7 7'],
  plus: ['M5 12h14', 'M12 5v14'],
  pencil: ['M21.2 6.8a1 1 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z', 'm15 5 4 4'],
  trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M10 11v6', 'M14 11v6'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  refresh: ['M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16', 'M8 16H3v5'],
  link: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'],
  message: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  note: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z', 'M14 2v5h5', 'M9 13h6', 'M9 17h4'],
  folder: ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z'],
  tag: ['M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z', 'M7.5 7.5h.01'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  layers: ['M12.8 2.2a2 2 0 0 0-1.6 0L2.6 6.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0l8.6-3.9a1 1 0 0 0 0-1.8z', 'm22 12.6-9.2 4.2a2 2 0 0 1-1.6 0L2 12.6', 'm22 17.6-9.2 4.2a2 2 0 0 1-1.6 0L2 17.6'],
  trending: ['M16 7h6v6', 'm22 7-8.5 8.5-5-5L2 17'],
  shield: ['M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
  terminal: ['m7 8-4 4 4 4', 'm17 8 4 4-4 4', 'm14 4-4 16'],
  star: ['M11.5 2.8a.5.5 0 0 1 1 0l2.3 4.7a2 2 0 0 0 1.6 1.2l5.1.7a.5.5 0 0 1 .3.9l-3.7 3.7a2 2 0 0 0-.6 1.8l.9 5.2a.5.5 0 0 1-.8.5l-4.6-2.4a2 2 0 0 0-2 0L6.4 21.5a.5.5 0 0 1-.8-.5l.9-5.2a2 2 0 0 0-.6-1.8L2.2 10.3a.5.5 0 0 1 .3-.9l5.1-.7a2 2 0 0 0 1.6-1.2z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  alert: ['m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3', 'M12 9v4', 'M12 17h.01'],
  circleCheck: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm8.5 12 2.5 2.5L16 9.5'],
  circleDot: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  sparkle: ['M12 3 13.8 8.6a2 2 0 0 0 1.3 1.3L21 12l-5.9 2.1a2 2 0 0 0-1.3 1.3L12 21l-1.8-5.6a2 2 0 0 0-1.3-1.3L3 12l5.9-2.1a2 2 0 0 0 1.3-1.3z', 'M19 3v3', 'M20.5 4.5h-3'],
  lock: ['M17 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  hash: ['M4 9h16', 'M4 15h16', 'M10 3 8 21', 'M16 3l-2 18'],
  save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  image: ['M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'm21 15-4.6-4.6a2 2 0 0 0-2.8 0L4 20'],
  bookmark: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z']
};

// GitHub's mark is a solid shape rather than a stroked outline.
const FILLED = {
  github: ['M12 .5C5.7.5.5 5.7.5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.7 1.2 3.4.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z']
};

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.75 }) {
  const filled = FILLED[name];
  const paths = filled || STROKED[name];
  if (!paths) return null;

  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap={filled ? undefined : 'round'}
      strokeLinejoin={filled ? undefined : 'round'}
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
