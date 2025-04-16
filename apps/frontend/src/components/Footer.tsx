import { Container } from "@/components/ui/container";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { Link } from "react-router";

export const Footer = () => {
  return (
    <footer className="py-4 bg-accent">
      <Container className="flex justify-between">
        <ModeToggle />
        <Link to="/more">Second Page</Link>
      </Container>
    </footer>
  );
};
