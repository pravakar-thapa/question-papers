import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UploadPanel from "./Upload";
import { apiRequest } from "../utils/apiRequest";

jest.mock("../utils/apiRequest", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

test("submits a PDF upload with metadata", async () => {
  apiRequest.mockResolvedValue({
    ok: true,
    data: { data: { duplicateSourceStatus: null } },
  });
  const refresh = jest.fn();

  render(<UploadPanel refresh={refresh} isUploaderAdmin />);

  fireEvent.change(screen.getByPlaceholderText("Title"), {
    target: { value: "Data Structures Midterm" },
  });
  fireEvent.change(screen.getByPlaceholderText("College"), {
    target: { value: "City College" },
  });
  fireEvent.change(screen.getByPlaceholderText("Course"), {
    target: { value: "BCA" },
  });
  fireEvent.change(screen.getByPlaceholderText("Semester"), {
    target: { value: "4" },
  });
  fireEvent.change(screen.getByPlaceholderText("Year"), {
    target: { value: "2026" },
  });
  fireEvent.change(screen.getByLabelText(/pdf file/i), {
    target: {
      files: [
        new File(["%PDF- test"], "paper.pdf", {
          type: "application/pdf",
        }),
      ],
    },
  });

  fireEvent.click(screen.getByRole("button", { name: /upload pdf/i }));

  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
    "/upload",
    expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
    }),
  ));
  expect(refresh).toHaveBeenCalled();
});
