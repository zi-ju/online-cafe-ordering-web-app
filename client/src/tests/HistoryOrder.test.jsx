import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import HistoryOrder from "../components/HistoryOrder";
import { useAuth0 } from "@auth0/auth0-react";

jest.mock("@auth0/auth0-react");

describe("HistoryOrder Component Tests", () => {
  beforeEach(() => {
    useAuth0.mockReturnValue({
      user: {
        sub: "mocked-auth0-id",
      },
    });

    global.fetch = jest.fn((url, options) => {
      if (
        url ===
        `${process.env.REACT_APP_API_URL}/users/orders?auth0Id=mocked-auth0-id` &&
        options.method === "GET"
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                createdAt: "2024-06-28T10:00:00Z",
                items: [
                  { id: 1, item: { name: "Coffee", id: 1 }, quantity: 2 },
                  { id: 2, item: { name: "Tea", id: 2 }, quantity: 1 },
                ],
                totalPrice: 15.0,
                deliveryFee: 5.0,
                address: "123 Main St",
                postalCode: "12345",
              },
            ]),
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

  test("renders order history correctly", async () => {
    render(<HistoryOrder />);

    // Wait for the orders to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText("Order History")).toBeInTheDocument();

      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Order ID: 1";
      })).toBeInTheDocument();

      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Coffee";
      })).toBeInTheDocument();

      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Tea";
      })).toBeInTheDocument();
      
      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Item Total Price: $15";
      })).toBeInTheDocument();
      
      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Address: 123 Main St";
      })).toBeInTheDocument();
      
      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Postal Code: 12345";
      })).toBeInTheDocument();
      
      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Delivery Fee: $5";
      })).toBeInTheDocument();

      expect(screen.getByText((content, element) => {
        const normalizedText = element.textContent.replace(/\n/g, "").trim();
        return normalizedText === "Total Price: $20";
      })).toBeInTheDocument();
    });
  });
});