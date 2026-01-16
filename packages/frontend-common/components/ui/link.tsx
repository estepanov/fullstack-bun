import { StyledLink } from "./styled-link";

export const Link = ({ ...props }: React.ComponentProps<typeof StyledLink>) => {
  return <StyledLink {...props} />;
};
