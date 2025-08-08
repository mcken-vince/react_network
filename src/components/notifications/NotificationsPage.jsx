import { Container } from "../atoms";
import NotificationsList from "./NotificationsList";

const NotificationsPage = () => {
  return (
    <Container size="medium" padding="medium">
      <NotificationsList />
    </Container>
  );
};

export default NotificationsPage;
