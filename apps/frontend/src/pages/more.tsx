import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";

const MorePage = () => {
  return (
    <Container className="space-y-2 mt-4">
      <h1 className="text-2xl font-bold">More</h1>
      <div>This is a new page on `/more`</div>
      <Link to="/">Back to the landing page</Link>
    </Container>
  );
};

export default MorePage;
