import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fetchGraph } from "./api/graphClient";
import { mockGraph } from "./data/mockGraph";

vi.mock("./api/graphClient", () => ({
  fetchGraph: vi.fn(async () => mockGraph),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchGraph).mockResolvedValue(mockGraph);
  });

  it("shows a loading state while the graph request is pending", () => {
    vi.mocked(fetchGraph).mockReturnValue(new Promise(() => undefined));

    render(<App />);

    expect(screen.getByText("Loading journey graph...")).toBeInTheDocument();
  });

  it("shows an error state when the graph request fails", async () => {
    vi.mocked(fetchGraph).mockRejectedValue(new Error("Request failed"));

    render(<App />);

    expect(await screen.findByText("Request failed")).toBeInTheDocument();
  });

  it("renders fetched forms and shows the selected form fields", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: /Form A/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Form D/i }));

    expect(screen.getByRole("heading", { name: "Form D" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "dynamic_checkbox_group" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "dynamic_object" })).toBeInTheDocument();
    expect(screen.getByText("Form A - email")).toBeInTheDocument();
  });

  it("opens the source picker and maps a field from a provider source", async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /Form D/i }));
    await userEvent.click(screen.getAllByRole("button", { name: /Add source/i })[0]);

    const dialog = screen.getByRole("dialog", { name: /Select source for dynamic_checkbox_group/i });
    expect(within(dialog).getByRole("heading", { name: "Direct dependencies" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Earlier dependencies" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Global data" })).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: /Form B - work_email/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Form B - work_email")).toBeInTheDocument();
  });

  it("filters source picker results and closes with Escape", async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /Form D/i }));
    await userEvent.click(screen.getAllByRole("button", { name: /Add source/i })[0]);

    const dialog = screen.getByRole("dialog", { name: /Select source for dynamic_checkbox_group/i });
    await userEvent.type(within(dialog).getByPlaceholderText("Search sources"), "not-a-source");

    expect(within(dialog).getByText("No matching sources.")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears an existing mapping", async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /Form D/i }));
    expect(screen.getByText("Form A - email")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Clear prefill mapping for email/i }));

    expect(screen.queryByText("Form A - email")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Add source/i })).toHaveLength(3);
  });
});
