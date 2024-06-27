import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../components/Home';
import { MemoryRouter } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

jest.mock('@auth0/auth0-react');

describe("Home Component Tests", () => {
    beforeEach(() => {
      useAuth0.mockReturnValue({
        user: {
            sub: "mockedauth0id",
          },
        isAuthenticated: true,
      });
  
      global.fetch = jest.fn((url, options) => {
        if (
            url === 
            `${process.env.REACT_APP_API_URL}/best-seller` 
            && options.method === "GET"
        ) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              name: "Best Coffee",
              description: "A description of the best coffee",
              image: "best-coffee.jpg",
            }),
          });
        }
        
        if (
            url ===
              `${process.env.REACT_APP_API_URL}/users?auth0Id=mockedauth0id` 
              && options.method === "GET"
          ) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ nickname: "MockedNickname" }),
            });
          }
        
        if (
            url === 
            `${process.env.REACT_APP_API_URL}/users/latest-order?auth0Id=mockedauth0id` 
            && options.method === "GET"
        ) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [{ item: { name: "Latte" } }, { item: { name: "Espresso" } }],
            }),
          });
        } 
      });
    });
  
    afterEach(() => {
      jest.resetAllMocks();
    });
    

    test('renders home page without authenticated user', async () => {
        useAuth0.mockReturnValueOnce({
            isAuthenticated: false,
        });
        render(
            <MemoryRouter>
            <Home />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText('Welcome to our coffee shop ☕️')).toBeInTheDocument();
            expect(screen.getByText('Sign in to see your latest order')).toBeInTheDocument();
        });
    });

});