import { MessagesContainer } from "@/components/messages/messages-container";
import { Container } from "frontend-common/components/ui";
import { useTranslation } from "react-i18next";

const LandingPage = () => {
	const { t: tLanding } = useTranslation("landing_page");

	return (
		<Container className="space-y-2 mt-4">
			<h1 className="text-2xl font-bold">{tLanding("title")}</h1>
			<p className="text-muted-foreground">{tLanding("description")}</p>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
			<p dangerouslySetInnerHTML={{ __html: tLanding("get_started") }} />
			<MessagesContainer />
		</Container>
	);
};

export default LandingPage;
