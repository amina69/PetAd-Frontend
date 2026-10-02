import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DisputeThread, type DisputeThreadComment } from "../DisputeThread";

const comments: DisputeThreadComment[] = [
  {
    id: "cmt-1",
    authorName: "Alice Smith",
    content: "The vet report shows a pre-existing condition.",
    createdAt: "2026-03-23T10:45:00.000Z",
  },
  {
    id: "cmt-2",
    authorName: "Happy Paws Shelter",
    content: "We are reviewing the claim.",
    createdAt: "2026-03-23T14:30:00.000Z",
  },
];

describe("DisputeThread", () => {
  it("renders the loading skeleton while still mounting the composer", () => {
    render(<DisputeThread isLoading />);

    expect(screen.getByTestId("dispute-thread-loading")).toBeInTheDocument();
    // Composer stays mounted during loading so it never has to move.
    expect(screen.getByTestId("dispute-comment-form")).toBeInTheDocument();
    expect(screen.getByTestId("dispute-comment-input")).toBeInTheDocument();
  });

  it("reserves vertical space so the composer does not shift once loaded", () => {
    render(<DisputeThread isLoading />);

    expect(screen.getByTestId("dispute-thread-body")).toHaveStyle({
      minHeight: "320px",
    });
  });

  it("renders the loaded comments", () => {
    render(<DisputeThread comments={comments} />);

    expect(screen.getByTestId("dispute-comment-list")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(
      screen.getByText("The vet report shows a pre-existing condition."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dispute-comment-cmt-2")).toBeInTheDocument();
  });

  it("renders the empty state when there are no comments", () => {
    render(<DisputeThread comments={[]} />);

    expect(screen.getByText("No comments yet")).toBeInTheDocument();
    expect(screen.queryByTestId("dispute-comment-list")).toBeNull();
  });

  it("renders an error state and retries when requested", () => {
    const onRetry = vi.fn();
    render(<DisputeThread isError onRetry={onRetry} />);

    expect(screen.getByTestId("dispute-thread-error")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("dispute-thread-retry"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("submits a trimmed comment and clears the input", async () => {
    const onSubmitComment = vi.fn().mockResolvedValue(undefined);
    render(<DisputeThread comments={comments} onSubmitComment={onSubmitComment} />);

    const input = screen.getByTestId("dispute-comment-input");
    fireEvent.change(input, { target: { value: "  Adding more evidence  " } });
    fireEvent.submit(screen.getByTestId("dispute-comment-form"));

    await waitFor(() => {
      expect(onSubmitComment).toHaveBeenCalledWith("Adding more evidence");
    });
    await waitFor(() => {
      expect((input as HTMLTextAreaElement).value).toBe("");
    });
  });

  it("keeps the submit button disabled while the draft is empty", () => {
    render(<DisputeThread comments={comments} onSubmitComment={vi.fn()} />);

    expect(screen.getByTestId("dispute-comment-submit")).toBeDisabled();
  });
});
