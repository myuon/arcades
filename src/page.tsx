import { Link } from "react-router-dom";

export default function Page() {
  return (
    <>
      <p>Games</p>
      <ul>
        <li>
          <Link to="/breakout">Breakout</Link>
        </li>
        <li>
          <Link to="/rains">Rains</Link>
        </li>
        <li>
          <Link to="/bullets">Bullets</Link>
        </li>
      </ul>

      <p>Others</p>
      <ul>
        <li>
          <Link to="/synth">Synth</Link>
        </li>
        <li>
          <Link to="/intersect">Intersect Demo</Link>
        </li>
        <li>
          <Link to="/gsx">GSX Demo</Link>
        </li>
        <li>
          <Link to="/scroll">Scroll Demo</Link>
        </li>
      </ul>
    </>
  );
}
