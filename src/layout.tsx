import { Link, Outlet } from "react-router-dom";

export default function Page() {
  return (
    <>
      <header>
        <Link to="/">
          <h2>Arcades</h2>
        </Link>
      </header>

      <Outlet />
    </>
  );
}
