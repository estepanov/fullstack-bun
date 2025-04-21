import { http, HttpResponse } from "msw";
import type { Example } from "shared/interfaces/example";

interface ExampleResponse {
  list: Example[];
}
export const getExamples = (response: ExampleResponse) =>
  http.get(`${process.env.VITE_API_BASE_URL}/example`, () => {
    return HttpResponse.json(response);
  });
