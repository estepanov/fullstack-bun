import { Link } from "react-router";

const CatchAll = () => {
  return (
    <>
      <div>Not Found</div>
      <Link to="/">Back to the landing page</Link>
    </>
  );
};

export default CatchAll;
