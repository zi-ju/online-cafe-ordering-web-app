import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import Profile from "../components/Profile";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";

jest.mock("@auth0/auth0-react");
jest.mock("../AuthTokenContext");

describe("Profile Component Tests", () => {
  beforeEach(() => {
    useAuth0.mockReturnValue({
      user: {
        name: "Mocked User",
        email: "mockeduser@example.com",
        email_verified: true,
        sub: "mockedauth0id",
      },
      isAuthenticated: true,
    });

    useAuthToken.mockReturnValue({ accessToken: "fake-token" });

    global.fetch = jest.fn((url, options) => {
      if (
        url ===
          `${process.env.REACT_APP_API_URL}/users?auth0Id=mockedauth0id` &&
        options.method === "GET"
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ nickname: "MockedNickname" }),
        });
      }

      if (
        url ===
          `${process.env.REACT_APP_API_URL}/users/mockedauth0id/nickname` &&
        options.method === "PUT"
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ nickname: "NewMockedNickname" }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders profile details and allows nickname update", async () => {
    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Name: Mocked User")).toBeInTheDocument();
    });
    expect(screen.getByText("📧 Email: mockeduser@example.com")).toBeInTheDocument();
    expect(screen.getByText("🔑 Auth0Id: mockedauth0id")).toBeInTheDocument();
    expect(screen.getByText("✅ Email verified: true")).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText("Nickname: MockedNickname")).toBeInTheDocument();
      });

    // Simulate changing nickname
    fireEvent.change(screen.getByPlaceholderText("New Nickname"), {
      target: { value: "NewMockedNickname" },
    });

    // Simulate submitting nickname update
    fireEvent.click(screen.getByText("Update Nickname"));

    // Wait for nickname update to complete
    await waitFor(() => {
      expect(screen.getByText("Nickname: NewMockedNickname")).toBeInTheDocument();
    });
  });
});