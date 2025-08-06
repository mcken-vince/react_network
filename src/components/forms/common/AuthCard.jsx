import { Heading, Text, Container, Stack } from "../../atoms";

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 p-5">
      <Container 
        size="small" 
        className="bg-white rounded-2xl p-10 shadow-2xl w-full max-w-lg"
      >
        <Stack spacing="large" className="text-center">
          <Stack spacing="small">
            <Heading level={1} color="gray-800" className="mb-0">
              {title}
            </Heading>
            <Text color="gray-600" className="mb-0">
              {subtitle}
            </Text>
          </Stack>
          {children}
        </Stack>
      </Container>
    </div>
  );
}

export default AuthCard;
