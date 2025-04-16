import { Container } from "@/components/ui/container";

import { Link } from "react-router";

export const Footer = () => {
  return (
    <footer className="py-4 bg-accent">
      <Container className="flex justify-between">
        <div>❤️</div>
        <Link to="/more">Second Page</Link>
      </Container>
    </footer>
  );
};
