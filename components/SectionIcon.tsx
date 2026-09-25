/** Sharp line icons for the section menu: 16px grid, 1.25 stroke, square caps, mitred joins. */
const P: Record<string, React.ReactNode> = {
  // a book with a colour chip
  brand: <><path d="M3 1.5h10v13H3z" /><path d="M5.5 1.5v13" /><path d="M8 4.5h3v3H8z" /></>,
  // a framed picture with a horizon
  gallery: <><path d="M2 3h12v10H2z" /><path d="M2 11l3.5-3.5 3 3 2-2L14 12" /><path d="M10.5 5.5h1v1h-1z" /></>,
  // a slide on a stand
  presentations: <><path d="M1.5 2.5h13" /><path d="M2.5 2.5v8h11v-8" /><path d="M8 10.5v3M5.5 14l2.5-3.5 2.5 3.5" /><path d="M5 7.5l2-2 1.5 1.5L11 4.5" /></>,
  // a square post with a speech tail
  social: <><path d="M2 2.5h12v8.5H7l-3 2.5V11H2z" /><path d="M5 6.75h6" /></>,
  // a kanban: three columns of cards
  vision: <><path d="M1.5 2.5h3v9h-3zM6.5 2.5h3v6h-3zM11.5 2.5h3v11h-3z" /></>,
  // a browser window
  website: <><path d="M1.5 2.5h13v11h-13z" /><path d="M1.5 5.5h13" /><path d="M3.5 4h1M5.5 4h1" /></>,
  // three stops, stepping forward
  journeys: <><path d="M1.5 10.5h3v3h-3zM6.5 6.5h3v3h-3zM11.5 2.5h3v3h-3z" /><path d="M4.5 12h3.5v-2.5M9.5 8H13V5.5" /></>,
  // overlapping squares: variations
  variants: <><path d="M2 5h7v7H2z" /><path d="M5 2h9v9h-2" /></>,
  // a target
  competitors: <><path d="M2 2h12v12H2z" /><path d="M5 5h6v6H5z" /><path d="M8 8h.01" /><path d="M7.5 7.5h1v1h-1z" /></>,
  // a page
  landing: <><path d="M3 1.5h7l3 3v10H3z" /><path d="M10 1.5v3h3" /><path d="M5.5 8h5M5.5 10.5h5" /></>,
};

export function SectionIcon({ name }: { name: string }) {
  return (
    <svg className="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
      {P[name] ?? P.landing}
    </svg>
  );
}
