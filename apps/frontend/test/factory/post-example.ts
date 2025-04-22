import { http, HttpResponse } from "msw";

export const postExample = () =>
  http.post(`${process.env.VITE_API_BASE_URL}/example`, () => {
    return HttpResponse.json({});
  });
