import { Link } from "react-router-dom";

export default function Page() {
  return (
    <ul>
      <li>
        <Link to="/breakout">Breakout</Link>
      </li>
      <li>
        <Link to="/intersect">Intersect Demo</Link>
      </li>
    </ul>
  );
}
