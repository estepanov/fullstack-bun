import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";

const CatchAll = () => {
  return (
    <Container className="space-y-2 mt-4">
      <h1 className="text-2xl font-bold">Not Found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link to="/">Back to the landing page</Link>
    </Container>
  );
};

export default CatchAll;
