import React from "react";
import { Container } from "../atoms";
import NotificationsList from "./NotificationsList";

const NotificationsPage: React.FC = () => {
  return (
    <Container size="medium" padding="medium">
      <NotificationsList />
    </Container>
  );
};

export default NotificationsPage;
