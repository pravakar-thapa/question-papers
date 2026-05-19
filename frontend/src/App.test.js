import { render, screen } from "@testing-library/react";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";

test("renders the question paper library", () => {
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );

  expect(screen.getByText(/find the best question papers/i)).toBeInTheDocument();
});
