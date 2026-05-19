import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PDFCard from "./PDFCard";

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const tokenPayload = btoa(
  JSON.stringify({ userId: "user-1", username: "rayan", role: "user" }),
);

const pdf = {
  _id: "pdf-1",
  title: "Algorithms Paper",
  college: "City College",
  course: "BCA",
  semester: "4",
  year: 2026,
  url: "https://example.com/paper.pdf",
  downloads: 0,
  comments: [],
};

beforeEach(() => {
  localStorage.setItem("token", `header.${tokenPayload}.signature`);
  global.fetch = jest.fn();
});

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

test("adds a comment to a PDF", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      comments: [
        {
          _id: "comment-1",
          text: "Very useful",
          username: "rayan",
          replies: [],
        },
      ],
    }),
  });

  render(<PDFCard pdf={pdf} refresh={jest.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: /comments/i }));
  fireEvent.change(screen.getByPlaceholderText(/write a comment/i), {
    target: { value: "Very useful" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^comment$/i }));

  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/pdf/pdf-1/comment"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "Very useful" }),
      }),
    ),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});
