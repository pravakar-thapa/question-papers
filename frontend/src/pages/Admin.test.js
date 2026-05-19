import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPanel from "./Admin";

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const tokenPayload = btoa(
  JSON.stringify({ userId: "admin-1", username: "admin", role: "admin" }),
);

const jsonResponse = (payload, ok = true) => ({
  ok,
  headers: { get: () => "application/json" },
  json: async () => payload,
});

beforeEach(() => {
  localStorage.setItem("token", `header.${tokenPayload}.signature`);
  jest.spyOn(window, "prompt").mockReturnValue("new-password");
  jest.spyOn(window, "confirm").mockReturnValue(true);
  global.fetch = jest.fn((url, options = {}) => {
    if (String(url).includes("/pending-pdfs")) {
      return Promise.resolve(
        jsonResponse({ data: { pendingPdfs: [] } }),
      );
    }
    if (String(url).includes("/admin/all-pdfs")) {
      return Promise.resolve(jsonResponse({ data: { pdfs: [] } }));
    }
    if (String(url).includes("/admin/audit-logs")) {
      return Promise.resolve(jsonResponse({ data: { logs: [] } }));
    }
    if (String(url).includes("/admin/users/user-1/password")) {
      return Promise.resolve(jsonResponse({ message: "Password reset" }));
    }
    if (
      String(url).includes("/admin/users/user-1") &&
      options.method === "DELETE"
    ) {
      return Promise.resolve(jsonResponse({ message: "User deleted" }));
    }
    if (String(url).includes("/admin/users")) {
      return Promise.resolve(
        jsonResponse({
          data: {
            users: [
              {
                _id: "user-1",
                username: "student",
                role: "user",
                contributionCount: 2,
              },
            ],
          },
        }),
      );
    }
    return Promise.resolve(jsonResponse({}));
  });
});

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

test("lets admins reset passwords and delete users", async () => {
  render(<AdminPanel refresh={jest.fn()} />);

  expect(await screen.findByText("student")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/users/user-1/password"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ newPassword: "new-password" }),
      }),
    ),
  );

  await waitFor(() =>
    expect(screen.getByRole("button", { name: /delete user/i })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /delete user/i }));
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/users/user-1"),
      expect.objectContaining({ method: "DELETE" }),
    ),
  );
});
